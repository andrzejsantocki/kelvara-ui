from pathlib import Path

ROOT = Path(__file__).parent
HTML = (ROOT / 'index.deployed.html').read_text()


def test_pages_custom_domain_routes_the_production_app():
    assert (ROOT / 'CNAME').read_text().strip() == 'app.kelvara.xyz'
    app = (ROOT / 'index.html').read_text()
    assert 'https://api.kelvara.xyz' in app
    assert 'const apiUrl=path=>`https://api.kelvara.xyz${path}`' in app


def test_kelvara_catalog_page_is_truthful_and_responsive():
    required = [
        'DEFI POSITION MONITORING', 'Know what changed before your capital is at risk.',
        'Kelvara monitors the control, economic, and upgrade assumptions behind your DeFi positions—so you can verify changes and prepare a constrained exit before you need one.',
        'Check my positions', 'SUPPORTED VAULTS', 'Across 1 protocol', 'MONITORED VAULT TVL',
        'Not verified', 'Know what can change around your position.',
        'Continuous evidence for the risks you actually control.', 'Authority Changes',
        'Privileged control and ownership changes.', 'Position Economics',
        'Fees, limits, caps, and other parameters affecting your position.', 'Program Upgrades',
        'Changes to the code your position depends on.', 'COVERAGE', 'Supported Positions',
        'Vaults Kelvara can inspect, monitor, and prepare for exit.', 'Position', 'Strategy',
        'Deposit', 'RWA Yield', 'Kamino • Solana', 'Type', 'Protocol', 'Chain',
        'USDG Steakhouse', 'Kamino', 'USDG', 'Solana', 'Coverage unknown', 'TVL not verified',
        'Across 1 protocol', 'prefers-reduced-motion', 'Connect wallet',
        'assets/kamino.svg', 'assets/tokens/usdg.png', 'assets/tokens/usdc.svg',
        'assets/tokens/usdt.svg', 'assets/tokens/solana.svg'
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
    for forbidden in ('$47.4M', 'Protected Capital', '3 scopes', '3 / 3', 'Infrastructure monitoring.', 'Monitored Assets', 'Known monitored asset'):
        assert forbidden not in HTML, forbidden
    assert 'id="connect-wallet"' in HTML


def test_landing_cta_is_a_distinct_accessible_primary_action():
    import re
    css = HTML.split('<style>', 1)[1].split('</style>', 1)[0]
    assert '.button{' in css and 'background:#111' in css
    assert 'min-height:44px' in css
    assert 'border-radius:999px' in css
    assert '.button:hover' in css and '.button:focus-visible' in css and '.button:active' in css
    assert '.button:disabled' in css
    assert 'transition:' in css
    assert 'prefers-reduced-motion: reduce' in HTML
    assert '@media(max-width:760px)' in HTML and '.button{width:100%' in HTML
    assert '.wallet-chip' in css and '.button' in css


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


def test_table_icons_use_standalone_chain_and_token_marks():
    import re
    assert 'assets/steakhouse-usdg.svg' not in re.search(r'<table\b[\s\S]*?</table>', HTML, re.I).group(0)
    sol = (ROOT / 'assets/tokens/solana.svg').read_text()
    assert '646' not in sol and '96' not in sol
    assert 'viewBox="0 0 24 24"' in sol or 'viewBox="0 0 32 32"' in sol
    assert '2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH' in (ROOT / 'assets/tokens/PROVENANCE.md').read_text()
