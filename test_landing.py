from pathlib import Path

HTML = Path(__file__).with_name('index.deployed.html').read_text()

def test_kelvara_catalog_page_is_truthful_and_responsive():
    required = [
        'Monitoring critical onchain infrastructure.', 'Assets Under Monitoring',
        'Vaults Under Monitoring', 'Monitoring Scopes', 'Authority Changes',
        'Economics', 'Program Upgrades', 'Monitored Assets', 'Search assets',
        'Type', 'Protocol', 'USDG Steakhouse', 'Kamino', 'USDG',
        'Coverage unknown', 'TVL not verified', 'Known asset', 'Across 1 protocol',
        'Monitor what can change.', 'prefers-reduced-motion', 'Connect wallet',
        'assets/kamino.svg', 'assets/steakhouse-usdg.svg'
    ]
    for text in required:
        assert text in HTML, text
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

def test_rejected_old_hero_patterns_are_removed():
    assert 'See what controls your onchain positions.' not in HTML
    assert 'MAINNET DEFI PROTECTION' not in HTML
    assert 'Illustrative product state' not in HTML
