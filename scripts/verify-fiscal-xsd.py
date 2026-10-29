"""Validate exported QA XML against OASIS UBL 2.1 XSD; never sends invoices.

Only public schema files are downloaded. XML instances are parsed locally with
network/entity access disabled. Requires lxml; no dependency of the app runtime.
"""
from pathlib import Path
from urllib.request import urlopen
from urllib.parse import urljoin
from tempfile import TemporaryDirectory
import hashlib
import json
import os
import re
import sys
from lxml import etree

BASE = 'https://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/'
XSD = '{http://www.w3.org/2001/XMLSchema}'
root = Path.cwd().resolve()
source = (root / sys.argv[1]).resolve() if len(sys.argv) == 2 else None
if source is None or not source.is_relative_to(root) or source.name != 'xml-validation' or not re.fullmatch(r'\.notaria-phase42-(?:qa|restaurada-qa)-[a-zA-Z0-9-]+', source.parent.name):
    raise SystemExit('Indica xml-validation exportado de una base QA 4.2 del proyecto.')
files = sorted(source.glob('SIM-*.xml'))
if not files:
    raise SystemExit('No hay XML QA exportados.')
parser = etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False)
hashes = {}
with TemporaryDirectory(prefix='notaria-ubl21-') as temp:
    directory = Path(temp)

    def fetch(url):
        if url in hashes:
            return directory / url[len(BASE):]
        if not url.startswith(BASE) or len(hashes) >= 80:
            raise ValueError('Importación XSD fuera del conjunto público OASIS permitido.')
        with urlopen(url, timeout=20) as response:
            if not response.url.startswith(BASE):
                raise ValueError('Redirección XSD no permitida.')
            data = response.read(8_000_001)
        if len(data) > 8_000_000:
            raise ValueError('Esquema demasiado grande.')
        target = directory / url[len(BASE):]
        if not target.resolve().is_relative_to(directory.resolve()):
            raise ValueError('Ruta XSD fuera del directorio temporal.')
        hashes[url] = hashlib.sha256(data).hexdigest()
        tree = etree.fromstring(data, parser)
        for node in list(tree.iter(XSD + 'import')) + list(tree.iter(XSD + 'include')):
            location = node.get('schemaLocation')
            if location:
                child = fetch(urljoin(url, location))
                node.set('schemaLocation', os.path.relpath(child, target.parent).replace(os.sep, '/'))
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(etree.tostring(tree, xml_declaration=True, encoding='UTF-8'))
        return target

    main = fetch(BASE + 'maindoc/UBL-Invoice-2.1.xsd')
    schema = etree.XMLSchema(etree.parse(str(main), parser))
    validated = []
    for file in files:
        schema.assertValid(etree.parse(str(file), parser))
        validated.append({'file': file.name, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
report = {'date': '2026-10-29', 'schema': BASE + 'maindoc/UBL-Invoice-2.1.xsd', 'schemas': hashes, 'validated': validated, 'allPassed': True, 'limits': ['Solo estructura XSD UBL 2.1. No valida reglas SUNAT, RUC, tributos, firma digital o CDR; no se envió ningún XML a red.']}
(root / 'docs/evidence/fase-4-2-xsd.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f'UBL 2.1 XSD: {len(validated)} XML QA válidos; {len(hashes)} esquemas públicos verificados.')
