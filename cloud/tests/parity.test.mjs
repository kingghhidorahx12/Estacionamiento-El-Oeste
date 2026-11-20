
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {hourly,quote,attachCoverage,attachMonthly,validateConfig,defaults,civilEpoch,businessDate} from '../lib/rules.mjs';
import {gunzipSync} from 'node:zlib';

const vectors=JSON.parse(gunzipSync(readFileSync(new URL('./fixtures/java-rules-v1.json.gz',import.meta.url))).toString('utf8'));

test('exact Java parity: defaults, historical hourly snapshots and complete service quotes',()=>{
 const {bathroomPrice,...historical}=defaults();
 assert.equal(bathroomPrice,0);
 assert.deepEqual(historical,vectors.config);
 for(const v of vectors.hours)assert.equal(hourly(v.elapsed,v.preferred,v.config),v.result);
 for(const v of vectors.quotes)assert.deepEqual(quote(v.stay,v.at),v.result);
});

test('coverage: overnight, monthly explicit dates, undefined schedule and civil zone',()=>{
 const c=defaults();c.opening='20:00';c.closing='08:00';
 const at=civilEpoch('2026-11-12','01:00'),s={mode:'free'};
 attachCoverage(s,at,c);
 assert.equal(s.coverageStart,civilEpoch('2026-11-11','20:00'));
 assert.equal(s.coverageEnd,civilEpoch('2026-11-12','08:00'));
 assert.equal(businessDate(at),'2026-11-12');

 const m={id:'test',mode:JSON.stringify(c.monthly[1]),start_at:at-1,end_at:at+1},monthly={};
 attachMonthly(monthly,at,m,c);
 assert.equal(monthly.coverageEnd,at+1);

 c.monthlyNightStart='20:00';c.monthlyNightEnd='08:00';
 validateConfig(c);
 c.monthlyNightEnd='09:00';
 assert.throws(()=>validateConfig(c));
});

test('bathroom rate starts disabled and must be a valid amount',()=>{
 const c=defaults();
 assert.equal(c.bathroomPrice,0);
 c.bathroomPrice=1000;
 assert.equal(validateConfig(c).bathroomPrice,1000);
 c.bathroomPrice=-1;
 assert.throws(()=>validateConfig(c),/Importe fuera de rango/);
});
