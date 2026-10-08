from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).parent


class TreeParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.root = {"tag": "#root", "attrs": {}, "children": []}
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = {"tag": tag, "attrs": dict(attrs), "children": []}
        self.stack[-1]["children"].append(node)
        if tag not in {"meta", "link", "img", "input", "br", "hr"}:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack[-1]["tag"] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index]["tag"] == tag:
                del self.stack[index:]
                return


def descendants(node):
    for child in node["children"]:
        yield child
        yield from descendants(child)


def find_id(root, value):
    return next(node for node in descendants(root) if node["attrs"].get("id") == value)


def direct_children(node):
    return [child for child in node["children"] if child["tag"] != "#text"]


def test_landing_header_groups_network_before_wallet_control():
    parser = TreeParser()
    parser.feed((ROOT / "index.html").read_text())
    realm = find_id(parser.root, "realm-label")
    assert realm["attrs"].get("class") == "tag"
    group = next(parent for parent in descendants(parser.root) if realm in parent["children"])
    assert "header-controls" in group["attrs"].get("class", "").split()
    children = direct_children(group)
    wallet_control = next(child for child in children if "wallet-control" in child["attrs"].get("class", "").split())
    assert children.index(realm) < children.index(wallet_control)
    assert find_id(parser.root, "network-selector")["attrs"].get("hidden") is None
    assert "wallet-modal" in find_id(parser.root, "network-selector")["attrs"].get("class", "")

    # Landing selector remains a user-invoked compact modal; it is not auto-opened by markup.
    assert 'id="network-selector" class="wallet-modal"' in (ROOT / "index.html").read_text()


def test_authenticated_header_uses_same_group_and_order():
    parser = TreeParser()
    parser.feed((ROOT / "app.html").read_text())
    network = find_id(parser.root, "network-control")
    wallet = find_id(parser.root, "header-connect")
    group = next(parent for parent in descendants(parser.root) if network in parent["children"])
    assert "header-controls" in group["attrs"].get("class", "").split()
    assert direct_children(group).index(network) < direct_children(group).index(wallet)


def test_header_css_defines_structural_spacing_and_quieter_network_utility():
    css = (ROOT / "styles.css").read_text()
    assert ".header-controls" in css
    assert "gap:20px" in css
    assert "#realm-label" in css
    assert "background:var(--paper)" in css
    assert "@media(max-width:720px)" in css
    assert "header-controls" in css[css.index("@media(max-width:720px)"):]
