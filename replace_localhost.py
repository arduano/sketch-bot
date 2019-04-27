import os
new = 'https://sketch-bot.herokuapp.com'
orig = 'http://localhost:8080'

for root, _, files in os.walk('www'):
    for _f in files:
        if 'node_modules' not in root:
            d = os.path.join(root, _f)
            try:
                s = open(d).read()
                if orig in s:
                    print(d)
                    s = s.replace(orig, new)
                    open(d, 'w').write(s)
            except:
                next