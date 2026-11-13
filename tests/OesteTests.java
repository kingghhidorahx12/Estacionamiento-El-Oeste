import mx.eloeste.core.*;
import mx.eloeste.desktop.*;
import org.json.*;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

public final class OesteTests {
    static int checks=0; static void ok(boolean v,String msg) { checks++; if(!v) throw new AssertionError(msg); }
    static void eq(long a,long b,String label) { ok(a==b,label+" expected "+b+", got "+a); }
    static JSONObject config=Rules.defaults();
    static String key() { return UUID.randomUUID().toString(); }
    static final class Client {
        Api api; String token,csrf; Client(Api api,String name,String password) { this.api=api; Api.Reply r=api.handle("POST","/api/login",new JSONObject().put("name",name).put("password",password),"","",""); ok(r.status==200,"login "+r.json); token=r.cookie; csrf=r.json.getString("csrf"); }
        Api.Reply post(String path,JSONObject b) { return post(path,b,key()); }
        Api.Reply post(String path,JSONObject b,String k) { if(path.equals("checkout")&&!b.has("expectedTotal")){JSONObject state=get("state");for(int i=0;i<state.getJSONArray("stays").length();i++){JSONObject stay=state.getJSONArray("stays").getJSONObject(i);if(stay.getString("id").equals(b.getString("id")))b.put("expectedTotal",stay.getJSONObject("quote").getLong("total"));}} return api.handle("POST","/api/"+path,b,token,csrf,k); }
        JSONObject get(String path) { Api.Reply r=api.handle("GET","/api/"+path,new JSONObject(),token,"",""); ok(r.status==200,"GET "+path+" "+r.json); return r.json; }
    }
    static JSONObject vehicle(String type) { return new JSONObject().put("type",type).put("plate","TEST123").put("brand","Prueba").put("color","Blanco"); }
    static JSONObject entry(int card,String mode,String wash) { return new JSONObject().put("card",card).put("vehicle",vehicle(wash.isEmpty()?"auto":wash)).put("service",new JSONObject().put("mode",mode).put("wash",wash)); }
    static JSONObject checkout(String id,long received) { return new JSONObject().put("id",id).put("received",received).put("vehicleConfirmed",true); }
    static JSONObject stay(String mode,String wash,long at) { JSONObject s=new JSONObject().put("mode",mode).put("wash",wash).put("rates",new JSONObject(config.toString())); Rules.attachCoverage(s,at,config); return new JSONObject().put("service",s.toString()).put("entered",at); }
    public static void main(String[] args) throws Exception {
        long[][] ordinary={{1000,1000},{3600000,1500},{3600001,2500},{4020000,2500},{4200000,2500},{4200001,3000},{4380000,3000},{6900000,3000},{7200000,3000},{7380000,4000},{7800000,4000},{7800001,4500},{9000000,4500},{10800000,4500}};
        for(long[] c:ordinary) eq(Rules.hourly(c[0],false,config),c[1],"hourly "+c[0]);
        long[][] pref={{3600000,1000},{4020000,2000},{4380000,2000},{7380000,3000},{9000000,3000}}; for(long[] c:pref) eq(Rules.hourly(c[0],true,config),c[1],"preferred");
        long entered=ZonedDateTime.of(2026,11,12,8,0,0,0,ZoneId.of(Rules.ZONE)).toInstant().toEpochMilli();
        for(String type:new String[]{"auto","camioneta","van","pickup"}) {
            long base=config.getJSONObject("wash").getLong(type); JSONObject wash=stay("wash_only",type,entered); eq(Rules.quote(wash,entered+7200000).getLong("total"),base,"wash only "+type);
            JSONObject missing=Rules.quote(stay("day_wash",type,entered),entered+3600000); eq(missing.getLong("total"),base+3000,"addon "+type); ok(missing.getBoolean("blocked"),"no invented coverage");
        }
        config.put("opening","08:00").put("closing","20:00");
        for(boolean preferred:new boolean[]{false,true}) { JSONObject s=stay("day_wash","auto",entered); JSONObject service=new JSONObject(s.getString("service")).put("preferred",preferred); s.put("service",service.toString()); for(long elapsed:new long[]{0,3600000,8*3600000,12*3600000}) { JSONObject q=Rules.quote(s,entered+elapsed); eq(q.getLong("total"),15000,"no hourly on covered day"); ok(!q.getBoolean("blocked"),"covered"); } ok(Rules.quote(s,entered+12*3600000+1).getBoolean("blocked"),"one second excess blocked"); }
        JSONObject temp=stay("temporary","",entered); eq(Rules.quote(temp,entered+1000).getLong("total"),10000,"early temporary fixed"); ok(!Rules.quote(temp,entered+12*3600000).getBoolean("blocked"),"12h exact"); ok(Rules.quote(temp,entered+12*3600000+1).getBoolean("blocked"),"12h + 1ms blocked");
        config.put("opening","20:00").put("closing","06:00"); JSONObject overnight=stay("day_wash","auto",entered+18*3600000); ok(!Rules.quote(overnight,entered+21*3600000).getBoolean("blocked"),"configured overnight jornada");
        config=Rules.defaults();
        AtomicLong time=new AtomicLong(entered);
        try(JdbcDb db=new JdbcDb(":memory:")) {
            Api api=new Api(db,time::get); api.bootstrap("admin","65432198"); Client admin=new Client(api,"admin","65432198");
            eq(admin.get("state").getJSONArray("cards").length(),35,"35 cards");
            ok(admin.post("users",new JSONObject().put("name","empleado").put("password","76543210").put("role","employee")).status==200,"create employee"); Client employee=new Client(api,"empleado","76543210");
            String request=key(); JSONObject body=entry(1,"day_wash","auto"); Api.Reply e=employee.post("entry",body,request); ok(e.status==200,"entry"); String id=e.json.getString("id");
            ok(employee.post("entry",body,request).json.getString("id").equals(id),"entry idempotence"); ok(employee.post("entry",entry(2,"hourly",""),request).status==400,"different payload replay rejected");
            ok(employee.post("checkout",checkout(id,15000)).status==400,"undefined day blocked for employee");
            ok(employee.post("checkout",checkout(id,15000).put("resolution",new JSONObject().put("extraCents",0).put("reason","Cobertura acordada por administración"))).status==400,"employee cannot resolve");
            JSONObject close=checkout(id,20000).put("resolution",new JSONObject().put("extraCents",0).put("reason","Se confirma cobertura para esta salida")); String payKey=key(); Api.Reply paid=admin.post("checkout",close,payKey); ok(paid.status==200,"admin resolves zero: "+paid.json); eq(paid.json.getLong("total"),15000,"wash+day 150"); eq(paid.json.getLong("change"),5000,"change");
            ok(admin.post("checkout",close,payKey).json.getString("id").equals(paid.json.getString("id")),"payment replay same receipt"); ok(admin.post("checkout",close).status==400,"second key cannot close again");
            JSONObject report=admin.get("report?date=2026-11-12"); eq(report.getLong("total"),15000,"one payment only"); eq(report.getJSONObject("categories").getLong("wash_auto"),12000,"wash separate"); eq(report.getJSONObject("categories").getLong("day_addon"),3000,"addon separate"); eq(report.getJSONObject("categories").getLong("parking_hourly_normal"),0,"hourly zero");
            JSONObject s=admin.get("state"),rates=s.getJSONObject("config"); rates.put("opening","08:00").put("closing","20:00"); ok(admin.post("config",new JSONObject().put("config",rates).put("version",s.getInt("version")).put("reason","Horario configurado explícitamente")).status==200,"configure hours");
            String hourly=employee.post("entry",entry(1,"hourly","")).json.getString("id");
            rates.put("ordinary",2000); ok(admin.post("config",new JSONObject().put("config",rates).put("version",2).put("reason","Nueva versión de tarifa")).status==200,"configure new hourly");
            time.addAndGet(3600000); JSONObject active=admin.get("state").getJSONArray("stays").getJSONObject(0); eq(active.getJSONObject("quote").getLong("total"),1500,"snapshot protects prior stay");
            ok(employee.post("checkout",checkout(hourly,1000)).status==400,"short payment blocked"); eq(db.one("SELECT COUNT(*) AS n FROM payments").getInt("n"),1,"rollback leaves no payment");
            ok(employee.post("checkout",checkout(hourly,1500)).status==200,"hourly close");
            String tempId=employee.post("entry",entry(1,"temporary","")).json.getString("id"); time.addAndGet(12*3600000+1);
            admin=new Client(api,"admin","65432198"); employee=new Client(api,"empleado","76543210");
            ok(employee.post("checkout",checkout(tempId,20000)).status==400,"late temporary blocked");
            Api.Reply late=admin.post("checkout",checkout(tempId,11000).put("resolution",new JSONObject().put("extraCents",1000).put("reason","Importe extraordinario acordado manualmente"))); ok(late.status==200,"explicit excess resolution"); eq(late.json.getLong("total"),11000,"no invented automatic excess");
            JSONObject monthly=new JSONObject().put("mode","12h").put("start",time.get()).put("end",time.get()+7*86400000L).put("vehicle",vehicle("pickup")).put("received",50000).put("manualDatesConfirmed",true); String monthlyKey=key(); Api.Reply m=admin.post("monthly",monthly,monthlyKey); ok(m.status==200,"manual monthly arbitrary explicitly agreed dates"); eq(m.json.getLong("total"),50000,"pickup does not select tier"); ok(admin.post("monthly",monthly,monthlyKey).json.getString("id").equals(m.json.getString("id")),"monthly replay"); ok(employee.post("monthly",monthly).status==400,"employee no monthly admin");
            monthly.remove("end"); ok(admin.post("monthly",monthly).status==400,"monthly end required");
            String lost=employee.post("entry",entry(1,"wash_only","van")).json.getString("id"); String oldToken=db.one("SELECT token FROM cards WHERE id=1").getString("token"); ok(employee.post("lost-card",new JSONObject().put("id",lost).put("reason","Cliente reporta tarjeta perdida").put("vehicleConfirmed",true).put("lossConfirmed",true)).status==200,"lost card"); ok(employee.post("scan",new JSONObject().put("token",oldToken)).status==400,"lost QR revoked"); eq(admin.get("state").getJSONArray("stays").getJSONObject(0).getJSONObject("quote").getLong("total"),27000,"van + lost card"); ok(employee.post("checkout",checkout(lost,27000)).status==200,"lost checkout"); ok(db.one("SELECT state FROM cards WHERE id=1").getString("state").equals("lost"),"lost card not reused");
            ok(admin.post("card-admin",new JSONObject().put("card",1).put("state","available").put("reason","Reemitir tarjeta con nuevo código")).status==200,"reissue");
            Api restored=new Api(db,time::get); eq(restored.pendingEvents().length(),5,"persistent outbox, no duplicate cash events");
            JSONArray events=api.pendingEvents(); for(int i=0;i<events.length();i++) { String remote=events.getJSONObject(i).getString("body"); ok(!remote.contains("TEST123")&&!remote.contains("vehicle")&&!remote.contains("color")&&!remote.contains("marca"),"no vehicle data in cloud events"); }
            for(int card=1;card<=30;card++) ok(employee.post("entry",entry(card,"hourly","")).status==200,"capacity entry "+card);
            ok(admin.post("card-admin",new JSONObject().put("card",31).put("state","available").put("reason","Activación administrativa de reserva")).status==200,"activate reserve"); ok(employee.post("entry",entry(31,"hourly","")).status==400,"35 cards never allows 31st vehicle");
            eq(db.one("SELECT COUNT(*) AS n FROM stays WHERE state='active'").getInt("n"),30,"occupancy 30");
        }
        // Two different requests racing for the same card must commit only one assignment.
        try(JdbcDb db=new JdbcDb(":memory:")) { Api api=new Api(db,time::get); api.bootstrap("admin","65432198"); Client a=new Client(api,"admin","65432198"),b=new Client(api,"admin","65432198"); ExecutorService executor=Executors.newFixedThreadPool(2); Future<Api.Reply> fa=executor.submit(()->a.post("entry",entry(1,"hourly",""))),fb=executor.submit(()->b.post("entry",entry(1,"hourly",""))); int sum=(fa.get().status==200?1:0)+(fb.get().status==200?1:0); eq(sum,1,"concurrent card assignment"); executor.shutdown(); }
        System.out.println("PASS · "+checks+" verificaciones de tarifas, pagos, permisos, concurrencia y persistencia.");
    }
}
