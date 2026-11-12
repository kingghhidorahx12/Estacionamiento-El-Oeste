"""Runs only against the isolated development preview, never the production database."""
import json
import urllib.request
import urllib.error
import http.cookiejar
import os
import http.client
from pathlib import Path

base='http://localhost:8787'
jar=http.cookiejar.CookieJar()
client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
checks=0
def check(value, label):
    global checks
    checks+=1
    assert value, label
def req(path, body=None, headers=None):
    data=None if body is None else json.dumps(body).encode()
    merged={'Origin':base, 'Content-Type':'application/json'}
    merged.update(headers or {})
    request=urllib.request.Request(base+path,data=data,headers=merged)
    try:
        with client.open(request,timeout=10) as response:
            return response.status, response.headers, response.read()
    except urllib.error.HTTPError as error:
        return error.code,error.headers,error.read()

status,headers,body=req('/')
check(status==200 and b'El Oeste' in body,'application shell')
check("frame-ancestors 'none'" in headers['Content-Security-Policy'],'CSP')
status,headers,body=req('/assets/icon-192.png')
check(status==200 and headers['Content-Type']=='image/png','PWA icon MIME type')
check(body.startswith(bytes([137,80,78,71,13,10,26,10])),'PWA icon is a real PNG')
status,headers,body=req('/api/state')
check(status==401 and headers['Cache-Control']=='no-store','no unauthenticated financial cache')
password=os.environ.get('OESTE_TEST_PIN') or Path('.dev/preview/credential.txt').read_text().strip()
status,headers,body=req('/api/login',{'name':'revision','password':password}, {'Origin':'https://other.invalid'})
check(status==403,'cross-origin login refused')
status,headers,body=req('/api/login',{'name':'revision','password':password})
check(status==200,'login')
check('HttpOnly' in headers['Set-Cookie'] and 'SameSite=Strict' in headers['Set-Cookie'],'cookie security')
csrf=json.loads(body)['csrf']
status,headers,body=req('/api/state')
check(status==200,'authenticated state')
status,headers,body=req('/api/logout',{}, {'X-CSRF':'wrong'})
check(status==400,'CSRF rejected')
status,headers,body=req('/api/report?date=2026-11-12')
report=json.loads(body)
check(status==200 and report['total']==sum(report['categories'].values()),'reconciled report')
check(report['total']==sum(payment['total'] for payment in report['payments']),'sum unique payments')
status,headers,body=req('/api/logout',{}, {'X-CSRF':csrf})
check(status==200,'logout')
status,headers,body=req('/api/state')
check(status==401,'session revoked')
for path in ('//Users/nexar/private.txt','/../README.md','/%2e%2e/README.md'):
    connection=http.client.HTTPConnection('localhost',8787,timeout=5)
    connection.putrequest('GET',path)
    connection.endheaders()
    response=connection.getresponse()
    check(response.status==404,'static path constrained to web root')
    response.read()
    connection.close()
print(f'PASS: {checks} verificaciones HTTP, cookies, origen, CSRF y conciliación')
