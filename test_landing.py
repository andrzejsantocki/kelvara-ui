from pathlib import Path

ROOT = Path(__file__).parent
HTML = (ROOT / 'index.deployed.html').read_text()


def test_kelvara_catalog_page_is_truthful_and_responsive():
    required = [
        'Monitoring critical onchain infrastructure.', 'Assets Under Monitoring',
        'Vaults Under Monitoring', 'Monitoring Scopes', 'Authority Changes',
        'Economics', 'Program Upgrades', 'Monitored Assets', 'Search assets',
        'Type', 'Protocol', 'Chain', 'USDG Steakhouse', 'Kamino', 'USDG',
        'Solana', 'Coverage unknown', 'TVL not verified', 'Known asset', 'Across 1 protocol',
        'Monitor what can change.', 'prefers-reduced-motion', 'Connect wallet',
        'assets/kamino.svg', 'assets/steakhouse-usdg.svg', 'assets/tokens/usdc.svg',
        'assets/tokens/usdt.svg', 'assets/tokens/solana.svg', 'assets/steakhouse-usdg.svg'
    ]
    for text in required:
        assert text in HTML, text
    assert 'https://kelvara.xyz' in HTML
    assert 'aria-label="Kelvara home"' in HTML
    assert '>Scopes<' not in HTML and '>Assets<' not in HTML
    assert '24.8M' not in HTML and '82.4M' not in HTML and '4 vaults' not in HTML
    assert 'wallet banner' not in HTML.lower()
    assert 'data-asset-row' in HTML and 'data-search' in HTML
    assert '@media' in HTML and 'max-width' in HTML
    assert 'display: grid' in HTML or 'display:grid' in HTML
    assert 'window.matchMedia' in HTML or 'prefers-reduced-motion: reduce' in HTML
    assert HTML.count('data-asset-row ') + HTML.count('data-asset-row>') == 1
    assert 'scope-num' not in HTML and '>01<' not in HTML and '>02<' not in HTML and '>03<' not in HTML
    assert 'Unknown</td>' not in HTML and '3 scopes' not in HTML and '3 active' not in HTML
    assert 'title="TVL not verified"' in HTML


def test_token_assets_are_local_images_with_provenance():
    for name in ('usdc.svg', 'usdt.svg', 'solana.svg'):
        path = ROOT / 'assets' / 'tokens' / name
        data = path.read_text()
        assert '<svg' in data[:500].lower()
        assert '<html' not in data[:500].lower()
    provenance = (ROOT / 'assets' / 'tokens' / 'PROVENANCE.md').read_text()
    assert 'EPjFWdd5AufqSS给予' not in provenance
    assert 'EPjFWdd5AufqSS' in provenance and 'Es9vMFrzaCER' in provenance


def test_table_image_sources_are_local_and_valid_over_http():
    import re
    from urllib.request import urlopen

    tables = re.findall(r'<table\\b[\\s\\S]*?</table>', HTML, re.I)
    assert tables
    sources = []
    for table in tables:
        sources.extend(re.findall(r"<img\\b[^>]*\\bsrc=['\"]([^'\"]+)", table, re.I))
    assert sources
    for source in sources:
        assert not source.startswith(('http://', 'https://', '//')), source
        with urlopen('http://127.0.0.1:7780/' + source.lstrip('/'), timeout=5) as response:
            body = response.read(256)
            assert response.status == 200, source
            assert 'text/html' not in response.headers.get('Content-Type', '').lower(), source
            assert body.lstrip().startswith((b'<svg', b'<?xml', b'\\x89PNG', b'GIF8', b'\\xff\\xd8')), source


def test_rejected_old_hero_patterns_are_removed():
    assert 'See what controls your onchain positions.' not in HTML
    assert 'MAINNET DEFI PROTECTION' not in HTML
    assert 'Illustrative product state' not in HTML
