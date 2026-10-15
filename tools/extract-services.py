"""Builds admin/services-default.json from the static services.html (one-off helper)."""
import re, json, html
s = open('services.html', encoding='utf-8').read()
data = json.loads(re.search(r'var DATA = (\{.*?\});\n', s, re.S).group(1))
sections = []
for m in re.finditer(r'<article class="os-block os-block--(\w+)" id="(\w+)">(.*?)</article>', s, re.S):
    color, sid, body = m.groups()
    title = re.search(r'<h2[^>]*>(.*?)</h2>', body, re.S).group(1).strip()
    sub = re.search(r'<div class="os-head">.*?<p>(.*?)</p>', body, re.S).group(1).strip()
    detail = 'class="os-detail"' in body
    items = []
    for li in re.finditer(r'<li>(.*?)</li>', body, re.S):
        li = li.group(1)
        key = re.search(r'data-info="([^"]+)"', li).group(1)
        if detail:
            label = re.search(r'<strong>(.*?)</strong>', li, re.S).group(1)
            desc = re.search(r'<span class="os-desc">(.*?)</span>', li, re.S).group(1)
        else:
            label = re.search(r'data-info="[^"]+">(.*?)<span class="os-i"', li, re.S).group(1)
            desc = None
        d = data.get(key, {})
        it = {'key': key, 'title': label, 'popupTitle': d.get('t', label), 'paragraphs': d.get('p', [])}
        if detail: it['desc'] = desc
        items.append(it)
    for it in items:
        for k in ('title', 'popupTitle', 'desc'):
            if k in it and it[k] is not None: it[k] = html.unescape(it[k])
    sections.append({'id': sid, 'color': color, 'title': html.unescape(title), 'subtitle': html.unescape(sub), 'detail': detail, 'items': items})
json.dump({'sections': sections}, open('admin/services-default.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print([(x['id'], len(x['items']), x['detail']) for x in sections], 'DATA keys', len(data), 'items', sum(len(x['items']) for x in sections))
used = {i['key'] for x in sections for i in x['items']}
print('unused DATA keys:', set(data) - used)
print('labels with tags:', [i['title'] for x in sections for i in x['items'] if '<' in i['title'] or '&' in i['title']])
