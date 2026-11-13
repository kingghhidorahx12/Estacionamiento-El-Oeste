package mx.eloeste.core;

import org.json.*;
import java.time.*;
import java.util.*;
import java.util.function.LongSupplier;

/** All writes, quote calculation and authorization run on the authoritative server. */
public final class Api {
    public static final class Reply {
        public int status=200; public JSONObject json; public String cookie;
        Reply(JSONObject json) { this.json=json; }
    }
    public interface Application {
        JSONObject status(); JSONObject prepareUpdate();
        default JSONObject peripherals(){return new JSONObject().put("supported",false).put("message","Configura la impresora en la tablet Android.");}
        default JSONObject peripheralAction(String action,JSONObject body){throw new IllegalArgumentException("La impresión térmica requiere la tablet Android.");}
    }
    private final Db db; private final LongSupplier clock; private final Application application;
    private final java.util.concurrent.ConcurrentHashMap<String,Long> clients=new java.util.concurrent.ConcurrentHashMap<>();
    private volatile long backupAt=0;
    public Api(Db db) { this(db,System::currentTimeMillis,null); }
    public Api(Db db, LongSupplier clock) { this(db,clock,null); }
    public Api(Db db, LongSupplier clock,Application application) { this.db=db; this.clock=clock; this.application=application; migrate(); }
    private void migrate() {
        for(String sql:new String[]{
            "CREATE TABLE IF NOT EXISTS settings(version INTEGER PRIMARY KEY,body TEXT NOT NULL,created INTEGER NOT NULL,actor TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,hash TEXT NOT NULL,role TEXT NOT NULL,active INTEGER NOT NULL DEFAULT 1)",
            "CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL,csrf TEXT NOT NULL,expires INTEGER NOT NULL)",
            "CREATE TABLE IF NOT EXISTS attempts(name TEXT PRIMARY KEY,count INTEGER NOT NULL,until_at INTEGER NOT NULL)",
            "CREATE TABLE IF NOT EXISTS cards(id INTEGER PRIMARY KEY,token TEXT UNIQUE NOT NULL,state TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS stays(id TEXT PRIMARY KEY,card_id INTEGER NOT NULL,vehicle TEXT NOT NULL,service TEXT NOT NULL,entered INTEGER NOT NULL,actor TEXT NOT NULL,state TEXT NOT NULL,exited INTEGER)",
            "CREATE UNIQUE INDEX IF NOT EXISTS one_active_card ON stays(card_id) WHERE state='active'",
            "CREATE TABLE IF NOT EXISTS monthly(id TEXT PRIMARY KEY,mode TEXT NOT NULL,start_at INTEGER NOT NULL,end_at INTEGER NOT NULL,vehicle TEXT NOT NULL,actor TEXT NOT NULL,created INTEGER NOT NULL)",
            "CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY,stay_id TEXT UNIQUE,monthly_id TEXT UNIQUE,lines TEXT NOT NULL,total INTEGER NOT NULL,actor TEXT NOT NULL,paid INTEGER NOT NULL)",
            "CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,fingerprint TEXT NOT NULL,body TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,at INTEGER NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,entity TEXT NOT NULL,detail TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS outbox(seq INTEGER PRIMARY KEY AUTOINCREMENT,event_id TEXT UNIQUE NOT NULL,body TEXT NOT NULL,confirmed INTEGER NOT NULL DEFAULT 0)",
            "CREATE TABLE IF NOT EXISTS meta(id TEXT PRIMARY KEY,value TEXT NOT NULL)"
        }) db.exec(sql);
        boolean displayColumn=false; JSONArray columns=db.query("PRAGMA table_info(users)");
        for(int i=0;i<columns.length();i++) if(columns.getJSONObject(i).getString("name").equals("display_name")) displayColumn=true;
        if(!displayColumn) { db.exec("ALTER TABLE users ADD COLUMN display_name TEXT NOT NULL DEFAULT ''"); db.exec("UPDATE users SET display_name=name"); }
        boolean activeColumn=false; columns=db.query("PRAGMA table_info(sessions)");
        for(int i=0;i<columns.length();i++) if(columns.getJSONObject(i).getString("name").equals("last_active")) activeColumn=true;
        if(!activeColumn) { db.exec("ALTER TABLE sessions ADD COLUMN last_active INTEGER NOT NULL DEFAULT 0"); db.exec("UPDATE sessions SET last_active=?",now()); }
        if (db.one("SELECT version FROM settings LIMIT 1")==null) db.exec("INSERT INTO settings VALUES(1,?,?,?)",Rules.defaults().toString(),now(),"system");
        if (db.one("SELECT id FROM meta WHERE id='installation'")==null) db.exec("INSERT INTO meta VALUES('installation',?)",Security.random());
        boolean needsEpoch=db.one("SELECT id FROM meta WHERE id='eventEpoch'")==null;
        if(needsEpoch) { db.exec("INSERT INTO meta VALUES('eventEpoch',?)",Security.random()); JSONArray oldEvents=db.query("SELECT seq,body FROM outbox"); for(int i=0;i<oldEvents.length();i++) { JSONObject row=oldEvents.getJSONObject(i),event=new JSONObject(row.getString("body")); if(!event.has("epoch")) { event.put("epoch",meta("eventEpoch")); db.exec("UPDATE outbox SET body=? WHERE seq=?",event.toString(),row.getLong("seq")); } } }
        for(int i=1;i<=35;i++) if(db.one("SELECT id FROM cards WHERE id=?",i)==null) db.exec("INSERT INTO cards VALUES(?,?,?)",i,Security.random(),i<=30?"available":"reserve");
        JSONObject existing=config();
        if(!existing.has("freeNormal")) {
            JSONObject additions=Rules.defaults();
            for(String key:new String[]{"freeNormal","freePreferred","monthlyNightStart","monthlyNightEnd"}) existing.put(key,additions.get(key));
            existing.put("monthly",additions.getJSONArray("monthly"));
            int version=configRow().getInt("version")+1;
            db.exec("INSERT INTO settings VALUES(?,?,?,?)",version,existing.toString(),now(),"system");
            audit("system","requirements_migration",String.valueOf(version),new JSONObject().put("note","Tiempo libre y modalidades mensuales confirmadas. Se conservan las tarifas de estancias anteriores y los contratos previos."));
        }
        if(!config().has("normalFromStart")||!config().has("preferredFullHour")){db.begin();try{ensureHourlyPolicy();ensurePreferredPolicy();db.commit();}catch(Exception e){db.rollback();throw e;}}
        String backup=meta("lastBackup");if(!backup.isEmpty())try{backupAt=Long.parseLong(backup);}catch(NumberFormatException ignored){}
    }
    private void ensureHourlyPolicy(){
        JSONObject current=config();if(current.has("normalFromStart"))return;
        current.put("ordinary",1500).put("preferred",1000).put("graceMinutes",10).put("normalPartial",1000).put("normalFromStart",true);
        int version=configRow().getInt("version")+1;db.exec("INSERT INTO settings VALUES(?,?,?,?)",version,current.toString(),now(),"system");
        audit("system","hourly_policy_corrected",String.valueOf(version),new JSONObject().put("note","Regla normal confirmada: primeros 10 minutos de cada hora $10; después $15. Nuevas entradas; se conservan snapshots anteriores y pagos."));
    }
    private void ensurePreferredPolicy(){
        JSONObject current=config();if(current.has("preferredFullHour"))return;
        current.put("preferred",1000).put("freePreferred",4000).put("preferredFullHour",true);
        int version=configRow().getInt("version")+1;db.exec("INSERT INTO settings VALUES(?,?,?,?)",version,current.toString(),now(),"system");
        audit("system","preferred_policy_corrected",String.valueOf(version),new JSONObject().put("note","Cliente preferencial: hora $10 sin fracciones; tiempo libre $40. Nuevas entradas; pagos y tarifas anteriores conservados."));
    }
    public synchronized boolean needsSetup() { return db.one("SELECT id FROM users LIMIT 1")==null; }
    /** Only called from the desktop console or tablet's protected native setup. No public setup endpoint. */
    public synchronized void bootstrap(String name,String password) {
        Rules.require(needsSetup(),"El administrador ya está configurado."); Security.pin(password); createUser(name,password,"admin");
    }
    private long now() { return clock.getAsLong(); }
    private JSONObject configRow() { return db.one("SELECT * FROM settings ORDER BY version DESC LIMIT 1"); }
    private JSONObject config() { return new JSONObject(configRow().getString("body")); }
    private void createUser(String name,String password,String role) {
        String displayName=name.trim(); name=displayName.toLowerCase(Locale.ROOT);
        Rules.require(name.matches("[a-zA-Z0-9._-]{3,40}"),"Usuario: 3 a 40 letras, números, puntos o guiones."); Security.pin(password);
        Rules.require(role.equals("admin")||role.equals("employee"),"Rol inválido.");
        Rules.require(db.one("SELECT id FROM users WHERE name=?",name)==null,"El usuario ya existe.");
        String salt=Security.random(); db.exec("INSERT INTO users(id,name,salt,hash,role,display_name) VALUES(?,?,?,?,?,?)",UUID.randomUUID().toString(),name,salt,Security.password(password,salt),role,displayName);
    }
    public synchronized Reply handle(String method,String path,JSONObject body,String token,String csrf,String requestKey) {
        return handleRequest(method,path,body,token,csrf,requestKey,"");
    }
    public synchronized Reply handle(String method,String path,JSONObject body,String token,String csrf,String requestKey,boolean interactive,String clientId) {
        return handleRequest(method,path,body,token,csrf,requestKey,clientId);
    }
    private Reply handleRequest(String method,String path,JSONObject body,String token,String csrf,String requestKey,String clientId) {
        try {
            if(path.equals("/api/login") && method.equals("POST")) return login(body);
            JSONObject user=db.one("SELECT u.id,u.name,u.display_name,u.role,s.csrf,s.last_active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>? AND u.active=1",Security.hash(token),now());
            if(user==null) return error(401,"Inicia sesión para continuar.");
            if(!method.equals("GET")) Rules.require(Security.equal(user.getString("csrf"),csrf),"Sesión inválida; vuelve a iniciar sesión.");
            if(path.equals("/api/logout") && method.equals("POST")) { db.exec("DELETE FROM sessions WHERE token=?",Security.hash(token)); Reply r=new Reply(new JSONObject().put("ok",true)); r.cookie=""; return r; }
            if(path.equals("/api/unlock")&&method.equals("POST")) {
                Rules.require(body.optString("name").trim().equalsIgnoreCase(user.getString("name")),"Desbloquea con el mismo usuario.");
                Reply result=login(body); if(result.status==200) db.exec("DELETE FROM sessions WHERE token=?",Security.hash(token)); return result;
            }
            if(clientId!=null&&clientId.matches("[a-zA-Z0-9_-]{16,100}")) { clients.entrySet().removeIf(e->now()-e.getValue()>180000);if(clients.size()<100||clients.containsKey(clientId))clients.put(clientId,now()); }
            if(method.equals("GET")) return new Reply(read(path,user));
            Rules.require(method.equals("POST"),"Método no admitido.");
            // A scan is a fresh lookup, never a cached entry/exit command.
            if(path.equals("/api/scan")) return new Reply(scan(body));
            Rules.require(requestKey.matches("[a-zA-Z0-9_-]{16,100}"),"Falta el identificador único de operación.");
            if(path.equals("/api/cancel-wash")||path.equals("/api/cancel-entry")) user.put("authorizedBy",authorizeCancellation(user,body));
            String key=user.getString("id")+":"+requestKey;
            db.begin();
            try {
                JSONObject prior=db.one("SELECT * FROM requests WHERE id=?",key);
                if(prior!=null) {
                    Rules.require(matchesRequest(prior.getString("fingerprint"),path,body),"Identificador reutilizado con datos distintos.");
                    db.commit(); return new Reply(new JSONObject(prior.getString("body")));
                }
                JSONObject result=write(path,body,user);
                if(!path.equals("/api/restore")&&!path.equals("/api/backup")) db.exec("INSERT INTO requests VALUES(?,?,?)",key,requestFingerprint(path,body),result.toString());
                db.commit(); return new Reply(result);
            } catch(Exception e) { db.rollback(); throw e; }
        } catch(IllegalArgumentException|JSONException e) { return error(400,e.getMessage()==null?"Datos inválidos.":e.getMessage()); }
        catch(Exception e) { System.err.println("API operation failed: "+e.getClass().getSimpleName()); return error(500,"No se guardó la operación. Consulta al administrador."); }
    }
    private String metadataFingerprint(String path,JSONObject body,String secret) {
        JSONObject metadata=new JSONObject(body.toString());metadata.remove(secret);return Security.hash(path+"\n"+metadata.toString());
    }
    private String requestFingerprint(String path,JSONObject body) {
        String secret=path.equals("/api/users")?"password":path.equals("/api/user-update")&&!body.optString("pin").isEmpty()?"pin":body.has("adminPin")?"adminPin":null;
        if(secret==null)return Security.hash(path+"\n"+body.toString());
        JSONObject account=secret.equals("adminPin")?db.one("SELECT salt,hash FROM users WHERE name=?",body.optString("adminName").trim().toLowerCase(Locale.ROOT)):path.equals("/api/users")?db.one("SELECT salt,hash FROM users WHERE name=?",body.getString("name").trim().toLowerCase(Locale.ROOT)):db.one("SELECT salt,hash FROM users WHERE id=?",body.getString("id"));
        // Reuse the PIN verifier already derived by the write. Never store a fast PIN hash.
        return new JSONObject().put("v",2).put("metadata",metadataFingerprint(path,body,secret)).put("secret",secret).put("salt",account.getString("salt")).put("hash",account.getString("hash")).toString();
    }
    private boolean matchesRequest(String saved,String path,JSONObject body) {
        if(saved.startsWith("{")) {
            JSONObject verifier=new JSONObject(saved);String secret=verifier.getString("secret");
            return verifier.getInt("v")==2&&Security.equal(verifier.getString("metadata"),metadataFingerprint(path,body,secret))&&Security.equal(verifier.getString("hash"),Security.password(body.optString(secret),verifier.getString("salt")));
        }
        String material=path+"\n"+body.toString();
        if(path.equals("/api/users")||path.equals("/api/user-update"))return Security.equal(saved,Security.password(Security.hash(material),meta("installation")))||Security.equal(saved,Security.hash(material));
        return Security.equal(saved,Security.hash(material));
    }
    private Reply login(JSONObject body) {
        String name=body.optString("name").trim().toLowerCase(Locale.ROOT), password=body.optString("password");
        Rules.require(name.length()<=40 && password.length()<=128,"Credenciales inválidas.");
        JSONObject fail=db.one("SELECT * FROM attempts WHERE name=?",name);
        if(fail!=null && fail.getInt("count")>=5 && fail.getLong("until_at")>now()) return error(429,"Demasiados intentos. Espera 15 minutos.");
        JSONObject u=db.one("SELECT * FROM users WHERE name=? AND active=1",name);
        String salt=u==null?"dummy-salt":u.getString("salt");
        boolean valid=Security.equal(Security.password(password,salt),u==null?Security.hash("invalid"):u.getString("hash"));
        if(!valid) { int count=fail!=null&&fail.getLong("until_at")>now()?fail.getInt("count")+1:1; db.exec("INSERT OR REPLACE INTO attempts VALUES(?,?,?)",name,count,now()+900000); return error(401,"Usuario o contraseña incorrectos."); }
        db.exec("DELETE FROM attempts WHERE name=?",name); db.exec("DELETE FROM sessions WHERE expires<=?",now());
        String token=Security.random(),csrf=Security.random();
        db.exec("INSERT INTO sessions(token,user_id,csrf,expires,last_active) VALUES(?,?,?,?,?)",Security.hash(token),u.getString("id"),csrf,now()+43200000,now());
        Reply r=new Reply(new JSONObject().put("csrf",csrf).put("name",u.getString("display_name")).put("role",u.getString("role"))); r.cookie=token; return r;
    }
    private JSONObject read(String path,JSONObject user) {
        if(path.equals("/api/peripherals")){admin(user);return application==null?new JSONObject().put("supported",false).put("message","Configura la impresora en la tablet Android."):application.peripherals();}
        if(path.equals("/api/application")) { admin(user);return application==null?new JSONObject().put("supported",false).put("message","La actualización se prepara en la tablet Android."):application.status(); }
        if(path.equals("/api/state")) {
            JSONArray stays=db.query("SELECT s.*,c.state AS card_state FROM stays s JOIN cards c ON c.id=s.card_id WHERE s.state='active' ORDER BY s.entered DESC");
            for(int i=0;i<stays.length();i++) stays.getJSONObject(i).put("quote",Rules.quote(stays.getJSONObject(i),now()));
            JSONObject r=new JSONObject().put("serverTime",now()).put("zone",Rules.ZONE).put("name",user.getString("display_name")).put("login",user.getString("name")).put("role",user.getString("role")).put("csrf",user.getString("csrf"))
                .put("config",config()).put("version",configRow().getInt("version")).put("cards",db.query("SELECT id,state FROM cards ORDER BY id")).put("stays",stays);
            r.put("monthly",db.query("SELECT m.*,CASE WHEN p.id IS NULL THEN 0 ELSE 1 END AS paid FROM monthly m LEFT JOIN payments p ON p.monthly_id=m.id WHERE m.end_at>=? ORDER BY m.created DESC LIMIT 500",isAdmin(user)?0:now()));
            r.put("report",report(today(),user.getString("role").equals("admin")?null:user.getString("name")));
            if(isAdmin(user)) r.put("users",db.query("SELECT id,name,display_name,role,active FROM users ORDER BY name"))
                .put("sync",new JSONObject().put("pending",db.one("SELECT COUNT(*) AS n FROM outbox WHERE confirmed=0").getInt("n")).put("last",meta("lastSync")));
            return r;
        }
        if(path.startsWith("/api/report?date=")) { admin(user); return report(LocalDate.parse(path.substring(17)).toString(),null); }
        if(path.startsWith("/api/history?")) {
            Map<String,String> params=params(path); LocalDate from=LocalDate.parse(params.get("from")),to=LocalDate.parse(params.get("to"));
            Rules.require(!to.isBefore(from)&&java.time.temporal.ChronoUnit.DAYS.between(from,to)<=366,"Elige un periodo de hasta 367 días.");
            String actor=isAdmin(user)?null:user.getString("name"); JSONArray days=new JSONArray(); long total=0;
            for(LocalDate day=from;!day.isAfter(to);day=day.plusDays(1)) { JSONObject daily=report(day.toString(),actor); total+=daily.getLong("total"); days.put(daily); }
            return new JSONObject().put("days",days).put("total",total);
        }
        if(path.equals("/api/cards")) { admin(user); return new JSONObject().put("cards",db.query("SELECT * FROM cards ORDER BY id")); }
        if(path.equals("/api/audit")) { admin(user); return new JSONObject().put("events",db.query("SELECT * FROM audit ORDER BY id DESC LIMIT 300")); }
        if(path.equals("/api/config-history")) { admin(user); return new JSONObject().put("versions",db.query("SELECT * FROM settings ORDER BY version DESC LIMIT 100")); }
        throw new IllegalArgumentException("Operación no encontrada.");
    }
    private JSONObject write(String path,JSONObject b,JSONObject u) {
        String actor=u.getString("name");
        if(path.equals("/api/peripheral-action")){admin(u);Rules.require(application!=null,"Configura la impresora en la tablet Android.");String action=b.getString("action");Rules.require(Arrays.asList("save","probe","test").contains(action),"Acción de periférico inválida.");JSONObject payload=action.equals("save")?PrinterProfile.validate(b.getJSONObject("profile")):new JSONObject();JSONObject result=application.peripheralAction(action,payload);audit(actor,"printer_"+action,"printer",new JSONObject());return result;}
        if(path.equals("/api/print-receipt")){
            Rules.require(application!=null,"La impresión requiere la tablet Android.");JSONObject payment=db.one("SELECT * FROM payments WHERE id=?",b.getString("id"));
            Rules.require(payment!=null&&(isAdmin(u)||payment.getString("actor").equals(actor)),"No puedes imprimir ese comprobante.");
            JSONObject owner=db.one("SELECT display_name FROM users WHERE name=?",payment.getString("actor"));
            JSONObject receipt=new JSONObject().put("id",payment.getString("id")).put("paid",payment.getLong("paid")).put("actor",owner==null?payment.getString("actor"):owner.getString("display_name")).put("total",payment.getLong("total")).put("lines",new JSONArray(payment.getString("lines")));
            JSONObject result=application.peripheralAction("receipt",receipt);audit(actor,"receipt_requested",payment.getString("id"),new JSONObject());return result;
        }
        if(path.equals("/api/backup")) {
            admin(u);
            try { JSONObject backup=Backups.export(db,b.getString("password"),now());backupAt=now();db.exec("INSERT OR REPLACE INTO meta VALUES('lastBackup',?)",String.valueOf(backupAt));audit(actor,"backup_export","local",new JSONObject().put("encrypted",true));return new JSONObject().put("backup",backup); } catch(IllegalArgumentException e) { throw e; } catch(Exception e) { throw new IllegalArgumentException("No se pudo crear el respaldo cifrado."); }
        }
        if(path.equals("/api/restore")) {
            admin(u); Rules.require(b.optString("confirmation").equals("RESTAURAR"),"Escribe RESTAURAR para confirmar la sustitución de datos locales."); JSONObject current=db.one("SELECT salt,hash FROM users WHERE id=?",u.getString("id")); Rules.require(Security.equal(Security.password(b.getString("pin"),current.getString("salt")),current.getString("hash")),"PIN de administrador incorrecto.");
            try { Backups.restore(db,b.getJSONObject("backup"),b.getString("password")); } catch(IllegalArgumentException e) { throw e; } catch(Exception e) { throw new IllegalArgumentException("El respaldo es incompatible o está dañado. No se restauró ningún dato."); }
            ensureHourlyPolicy();ensurePreferredPolicy();audit(actor,"backup_restored","local",new JSONObject().put("sessionsRevoked",true)); return new JSONObject().put("ok",true).put("loginRequired",true);
        }
        if(path.equals("/api/entry")) {
            Rules.require(db.one("SELECT COUNT(*) AS n FROM stays WHERE state='active'").getInt("n")<30,"Capacidad máxima: 30 vehículos.");
            int card=b.getInt("card"); JSONObject c=db.one("SELECT * FROM cards WHERE id=?",card);
            Rules.require(c!=null && c.getString("state").equals("available"),"La tarjeta no está disponible.");
            JSONObject v=vehicle(b.getJSONObject("vehicle")), s=b.getJSONObject("service");
            String mode=s.getString("mode"), wash=s.optString("wash",""); JSONObject rates=config();
            Rules.require(Arrays.asList("hourly","free","temporary","day_wash","wash_only","monthly").contains(mode),"Modalidad inválida.");
            Rules.require(wash.isEmpty()||rates.getJSONObject("wash").has(wash),"Lavado sin tarifa confirmada.");
            Rules.require(wash.isEmpty()||v.getString("type").equals(wash),"El lavado debe corresponder al tipo confirmado del vehículo.");
            Rules.require((!mode.equals("day_wash")&&!mode.equals("wash_only"))||!wash.isEmpty(),"Selecciona un lavado para esta modalidad.");
            JSONObject service=new JSONObject().put("mode",mode).put("wash",wash).put("preferred",s.optBoolean("preferred")).put("rates",rates).put("rateVersion",configRow().getInt("version"));
            long entered=now(); Rules.attachCoverage(service,entered,rates);
            if(mode.equals("monthly")) {
                JSONObject contract=db.one("SELECT m.* FROM monthly m JOIN payments p ON p.monthly_id=m.id WHERE m.id=?",s.getString("monthlyId"));
                Rules.require(contract!=null,"Selecciona una pensión mensual pagada.");
                v=new JSONObject(contract.getString("vehicle")); Rules.attachMonthly(service,entered,contract,rates);
            }
            String id=UUID.randomUUID().toString(); db.exec("INSERT INTO stays(id,card_id,vehicle,service,entered,actor,state) VALUES(?,?,?,?,?,?,'active')",id,card,v.toString(),service.toString(),entered,actor);
            db.exec("UPDATE cards SET state='assigned' WHERE id=?",card); audit(actor,"entry",id,service);
            return new JSONObject().put("id",id).put("entered",entered);
        }
        if(path.equals("/api/cancel-entry")) {
            JSONObject stay=active(b.getString("id")); String why=reason(b);
            Rules.require(db.one("SELECT id FROM payments WHERE stay_id=?",stay.getString("id"))==null,"Una estancia pagada requiere revisión administrativa; no se elimina su pago.");
            db.exec("UPDATE stays SET state='cancelled' WHERE id=?",stay.getString("id"));
            db.exec("UPDATE cards SET state='available' WHERE id=? AND state='assigned'",stay.getInt("card_id"));
            audit(actor,"entry_cancelled",stay.getString("id"),new JSONObject().put("reason",why).put("authorizedBy",u.getString("authorizedBy")));
            return new JSONObject().put("ok",true);
        }
        if(path.equals("/api/cancel-wash")) {
            JSONObject s=active(b.getString("id")), service=new JSONObject(s.getString("service"));
            Rules.require(!service.optString("wash").isEmpty(),"No hay lavado activo."); String reason=reason(b);
            if(service.getString("mode").equals("day_wash")||service.getString("mode").equals("wash_only")) {
                Rules.require(b.has("replacementMode"),"Al cancelar este paquete, el administrador debe seleccionar la modalidad restante explícitamente.");
                String replacement=b.getString("replacementMode"); Rules.require(replacement.equals("hourly")||replacement.equals("temporary"),"Modalidad restante inválida."); service.put("mode",replacement);
            }
            service.put("wash",""); db.exec("UPDATE stays SET service=? WHERE id=?",service.toString(),s.getString("id")); audit(actor,"cancel_wash",s.getString("id"),new JSONObject().put("reason",reason).put("authorizedBy",u.getString("authorizedBy")));
            return new JSONObject().put("ok",true);
        }
        if(path.equals("/api/lost-card")) {
            JSONObject s=active(b.getString("id")), service=new JSONObject(s.getString("service"));
            Rules.require(!service.optBoolean("lostCard"),"El extravío ya fue registrado.");
            Rules.require(b.optBoolean("vehicleConfirmed")&&b.optBoolean("lossConfirmed"),"Confirma características del vehículo y declaración de extravío.");
            String reason=reason(b); service.put("lostCard",true); db.exec("UPDATE stays SET service=? WHERE id=?",service.toString(),s.getString("id"));
            db.exec("UPDATE cards SET state='lost',token=? WHERE id=?",Security.random(),s.getInt("card_id")); audit(actor,"lost_card",s.getString("id"),new JSONObject().put("reason",reason)); return new JSONObject().put("ok",true);
        }
        if(path.equals("/api/replace-card")) {
            admin(u); JSONObject s=active(b.getString("id")); JSONObject previous=db.one("SELECT state FROM cards WHERE id=?",s.getInt("card_id"));
            Rules.require(previous.getString("state").equals("lost"),"Registra y confirma primero el extravío.");
            int card=b.getInt("card"); JSONObject next=db.one("SELECT state FROM cards WHERE id=?",card);
            Rules.require(next!=null&&(next.getString("state").equals("reserve")||next.getString("state").equals("available")),"Selecciona una tarjeta de reserva o disponible.");
            String why=reason(b); db.exec("UPDATE stays SET card_id=? WHERE id=?",card,s.getString("id")); db.exec("UPDATE cards SET state='assigned' WHERE id=?",card);
            audit(actor,"replace_lost_card",s.getString("id"),new JSONObject().put("old",s.getInt("card_id")).put("new",card).put("reason",why)); return new JSONObject().put("ok",true);
        }
        if(path.equals("/api/checkout")) {
            JSONObject s=active(b.getString("id")); Rules.require(b.optBoolean("vehicleConfirmed"),"Confirma físicamente el vehículo antes de la salida.");
            JSONObject q=Rules.quote(s,now()); JSONObject resolution=b.optJSONObject("resolution");
            Rules.require(Rules.amount(b,"expectedTotal")==q.getLong("total"),"El importe cambió con el tiempo transcurrido. Actualiza la salida y confirma el nuevo total.");
            if(q.getBoolean("blocked")) {
                admin(u); Rules.require(resolution!=null,"Se requiere resolución administrativa explícita.");
                long extra=Rules.amount(resolution,"extraCents"); String why=reason(resolution);
                String mode=new JSONObject(s.getString("service")).getString("mode");
                // A human may explicitly decide a zero or positive adjustment; no automatic excess policy exists.
                String category=mode.equals("temporary")?"pension_temporary":mode.equals("free")?(new JSONObject(s.getString("service")).optBoolean("preferred")?"time_free_preferred":"time_free_normal"):mode.equals("monthly")?(new JSONObject(s.getString("service")).getInt("monthlyHours")==12?"pension_monthly_12":"pension_monthly_24"):"day_addon";
                if(extra>0) q.getJSONArray("lines").put(Rules.line(category,"Resolución administrativa · "+why,extra));
                q.put("total",q.getLong("total")+extra); audit(actor,"administrative_resolution",s.getString("id"),new JSONObject(resolution.toString()).put("quotedAt",q.getLong("at")));
            } else Rules.require(resolution==null,"No se necesita ajuste para esta cobertura.");
            long received=Rules.amount(b,"received"); Rules.require(received>=q.getLong("total"),"El efectivo recibido es insuficiente.");
            JSONObject paid=payment(s.getString("id"),null,q.getJSONArray("lines"),actor,q.getLong("at"));
            db.exec("UPDATE stays SET state='closed',exited=? WHERE id=?",q.getLong("at"),s.getString("id"));
            db.exec("UPDATE cards SET state='available' WHERE id=? AND state='assigned'",s.getInt("card_id"));
            audit(actor,"checkout",s.getString("id"),new JSONObject().put("payment",paid.getString("id")));
            return paid.put("received",received).put("change",received-q.getLong("total"));
        }
        if(path.equals("/api/monthly")) {
            admin(u); long start=Rules.integer(b,"start"),end=Rules.integer(b,"end"); Rules.require(start>0 && end>start,"Registra inicio y fin explícitos; no se calcula un mes automáticamente.");
            JSONObject selected=null; JSONArray modes=config().getJSONArray("monthly"); for(int i=0;i<modes.length();i++) if(modes.getJSONObject(i).getString("id").equals(b.getString("mode"))) selected=modes.getJSONObject(i);
            Rules.require(selected!=null,"Selecciona una modalidad mensual válida."); JSONObject v=vehicle(b.getJSONObject("vehicle"));
            Rules.require(b.optBoolean("manualDatesConfirmed"),"Confirma las fechas acordadas manualmente.");
            boolean payNow=b.optBoolean("payNow",true); long received=payNow?Rules.amount(b,"received"):0; Rules.require(!payNow||received>=selected.getLong("price"),"Efectivo insuficiente.");
            String id=UUID.randomUUID().toString(); db.exec("INSERT INTO monthly VALUES(?,?,?,?,?,?,?)",id,selected.toString(),start,end,v.toString(),actor,now());
            audit(actor,"monthly_manual",id,new JSONObject().put("start",start).put("end",end).put("mode",selected));
            if(!payNow) return new JSONObject().put("id",id).put("unpaid",true);
            JSONObject p=payment(null,id,new JSONArray().put(Rules.line(selected.getInt("hours")==12?"pension_monthly_12":"pension_monthly_24","Pensión mensual · "+selected.getString("name"),selected.getLong("price"))),actor,now());
            return p.put("received",received).put("change",received-selected.getLong("price"));
        }
        if(path.equals("/api/monthly-pay")) {
            admin(u); JSONObject m=db.one("SELECT * FROM monthly WHERE id=?",b.getString("id")); Rules.require(m!=null,"Pensión desconocida."); Rules.require(db.one("SELECT id FROM payments WHERE monthly_id=?",b.getString("id"))==null,"La mensualidad ya está pagada.");
            JSONObject mode=new JSONObject(m.getString("mode")); Rules.require(mode.has("hours"),"Contrato anterior sin modalidad horaria; requiere regularización manual."); long received=Rules.amount(b,"received"); Rules.require(received>=mode.getLong("price"),"Efectivo insuficiente.");
            JSONObject p=payment(null,m.getString("id"),new JSONArray().put(Rules.line(mode.getInt("hours")==12?"pension_monthly_12":"pension_monthly_24","Pensión mensual · "+mode.getString("name"),mode.getLong("price"))),actor,now()); audit(actor,"monthly_paid",m.getString("id"),new JSONObject().put("payment",p.getString("id"))); return p.put("received",received).put("change",received-mode.getLong("price"));
        }
        if(path.equals("/api/config")) {
            admin(u); Rules.require(b.getInt("version")==configRow().getInt("version"),"Otro administrador actualizó las tarifas. Recarga antes de guardar.");
            JSONObject c=b.getJSONObject("config"); Rules.validateConfig(c); String why=reason(b); int version=configRow().getInt("version")+1;
            db.exec("INSERT INTO settings VALUES(?,?,?,?)",version,c.toString(),now(),actor); audit(actor,"config",String.valueOf(version),new JSONObject().put("reason",why)); return new JSONObject().put("version",version);
        }
        if(path.equals("/api/application-update")) {admin(u);Rules.require(application!=null,"La actualización se prepara en la tablet Android.");JSONObject result=application.prepareUpdate();audit(actor,"update_requested","application",new JSONObject());return result;}
        if(path.equals("/api/users")) { admin(u); createUser(b.getString("name"),b.getString("password"),b.getString("role")); audit(actor,"user_created",b.getString("name"),new JSONObject().put("role",b.getString("role"))); return new JSONObject().put("ok",true); }
        if(path.equals("/api/user-update")) {
            admin(u); JSONObject target=db.one("SELECT * FROM users WHERE id=?",b.getString("id")); Rules.require(target!=null,"Usuario desconocido."); String role=b.getString("role"); Rules.require(role.equals("admin")||role.equals("employee"),"Rol inválido."); boolean enabled=b.getBoolean("active");
            if(target.getString("role").equals("admin")&&(!enabled||!role.equals("admin"))) Rules.require(db.one("SELECT COUNT(*) AS n FROM users WHERE role='admin' AND active=1").getInt("n")>1,"Conserva al menos un administrador activo.");
            db.exec("UPDATE users SET role=?,active=? WHERE id=?",role,enabled?1:0,target.getString("id"));
            if(b.has("displayName")) { String display=b.getString("displayName").trim(); Rules.require(!display.isEmpty()&&display.length()<=80,"Nombre visible: de 1 a 80 caracteres."); db.exec("UPDATE users SET display_name=? WHERE id=?",display,target.getString("id")); }
            String pin=b.optString("pin"); if(!pin.isEmpty()) { Security.pin(pin); String salt=Security.random(); db.exec("UPDATE users SET salt=?,hash=? WHERE id=?",salt,Security.password(pin,salt),target.getString("id")); }
            if(!pin.isEmpty()||!role.equals(target.getString("role"))||enabled!=(target.getInt("active")==1)) db.exec("DELETE FROM sessions WHERE user_id=?",target.getString("id")); audit(actor,"user_updated",target.getString("name"),new JSONObject().put("role",role).put("active",enabled).put("pinReset",!pin.isEmpty())); return new JSONObject().put("ok",true);
        }
        if(path.equals("/api/card-admin")) {
            admin(u); int id=b.getInt("card"); JSONObject c=db.one("SELECT * FROM cards WHERE id=?",id); Rules.require(c!=null,"Tarjeta desconocida.");
            Rules.require(db.one("SELECT id FROM stays WHERE card_id=? AND state='active'",id)==null,"La tarjeta está asociada a una estancia activa.");
            String state=b.getString("state"); Rules.require(Arrays.asList("available","suspended","reserve","revoked").contains(state),"Estado inválido."); String why=reason(b);
            String token=Security.random(); db.exec("UPDATE cards SET state=?,token=? WHERE id=?",state,token,id); audit(actor,"card_"+state,String.valueOf(id),new JSONObject().put("reason",why)); return new JSONObject().put("ok",true).put("token",token);
        }
        throw new IllegalArgumentException("Operación no encontrada.");
    }
    private JSONObject vehicle(JSONObject v) {
        String type=v.getString("type"),plate=v.optString("plate").trim().toUpperCase(Locale.ROOT),color=v.optString("color").trim(),brand=v.optString("brand").trim(),notes=v.optString("notes").trim();
        Rules.require(Arrays.asList("auto","moto","camioneta","van","pickup").contains(type),"Tipo inválido.");
        Rules.require(plate.length()<=20 && color.length()<=50 && brand.length()<=60 && notes.length()<=500,"Descripción demasiado larga.");
        Rules.require(!color.isEmpty(),"Confirma el color del vehículo."); Rules.require(!plate.isEmpty()||!notes.isEmpty(),"Sin placas, añade una descripción del vehículo.");
        return new JSONObject().put("type",type).put("plate",plate).put("color",color).put("brand",brand).put("notes",notes);
    }
    private JSONObject active(String id) { JSONObject s=db.one("SELECT * FROM stays WHERE id=? AND state='active'",id); Rules.require(s!=null,"La estancia ya fue cerrada o no existe."); return s; }
    private JSONObject scan(JSONObject body) {
        JSONObject card=body.has("token")?db.one("SELECT id,state FROM cards WHERE token=?",body.getString("token")):db.one("SELECT id,state FROM cards WHERE id=?",body.getInt("card"));
        Rules.require(card!=null,"Código desconocido o revocado.");
        JSONObject stay=db.one("SELECT id FROM stays WHERE card_id=? AND state='active'",card.getInt("id"));
        String status=card.getString("state");
        return card.put("action",status.equals("assigned")&&stay!=null?"exit":status.equals("available")&&stay==null?"entry":"blocked").put("stayId",stay==null?JSONObject.NULL:stay.getString("id"));
    }
    private String authorizeCancellation(JSONObject user,JSONObject body) {
        if(isAdmin(user)) return user.getString("name");
        String name=body.optString("adminName").trim().toLowerCase(Locale.ROOT),pin=body.optString("adminPin");
        Rules.require(name.length()<=40&&pin.length()<=128,"Credenciales inválidas.");
        String attempt="cancel:"+name; JSONObject fail=db.one("SELECT * FROM attempts WHERE name=?",attempt);
        Rules.require(fail==null||fail.getInt("count")<5||fail.getLong("until_at")<=now(),"Demasiados intentos. Espera 15 minutos.");
        JSONObject account=db.one("SELECT * FROM users WHERE name=? AND role='admin' AND active=1",name);
        boolean valid=Security.equal(Security.password(pin,account==null?"dummy-salt":account.getString("salt")),account==null?Security.hash("invalid"):account.getString("hash"));
        if(!valid) { int count=fail!=null&&fail.getLong("until_at")>now()?fail.getInt("count")+1:1; db.exec("INSERT OR REPLACE INTO attempts VALUES(?,?,?)",attempt,count,now()+900000); throw new IllegalArgumentException("Se requiere autorización de un administrador activo."); }
        db.exec("DELETE FROM attempts WHERE name=?",attempt); return name;
    }
    private String reason(JSONObject b) { String s=b.optString("reason").trim(); Rules.require(s.length()>=4 && s.length()<=500,"Registra un motivo de 4 a 500 caracteres."); return s; }
    private boolean isAdmin(JSONObject u) { return u.getString("role").equals("admin"); }
    private void admin(JSONObject u) { Rules.require(isAdmin(u),"Se requiere un usuario administrador."); }
    private void audit(String actor,String action,String entity,JSONObject detail) { db.exec("INSERT INTO audit(at,actor,action,entity,detail) VALUES(?,?,?,?,?)",now(),actor,action,entity,detail.toString()); }
    private JSONObject payment(String stay,String monthly,JSONArray lines,String actor,long at) {
        long total=0; for(int i=0;i<lines.length();i++) total+=lines.getJSONObject(i).getLong("cents");
        if(stay!=null&&lines.length()==0&&total==0) return new JSONObject().put("id","close-"+stay).put("paid",at).put("total",0).put("lines",lines).put("actor",actor).put("covered",true);
        String id=UUID.randomUUID().toString(); db.exec("INSERT INTO payments VALUES(?,?,?,?,?,?,?)",id,stay,monthly,lines.toString(),total,actor,at);
        JSONArray safeLines=new JSONArray(); for(int i=0;i<lines.length();i++) { JSONObject l=lines.getJSONObject(i); safeLines.put(new JSONObject().put("category",l.getString("category")).put("cents",l.getLong("cents"))); }
        JSONObject event=new JSONObject().put("id",id).put("installation",meta("installation")).put("epoch",meta("eventEpoch")).put("paid",at).put("actor",actor).put("lines",safeLines).put("total",total);
        db.exec("INSERT INTO outbox(event_id,body) VALUES(?,?)",id,event.toString());
        return new JSONObject().put("id",id).put("paid",at).put("total",total).put("lines",lines).put("actor",actor);
    }
    private String today() { return Instant.ofEpochMilli(now()).atZone(ZoneId.of(Rules.ZONE)).toLocalDate().toString(); }
    private JSONObject report(String date,String actor) {
        LocalDate d=LocalDate.parse(date); ZoneId z=ZoneId.of(Rules.ZONE); long a=d.atStartOfDay(z).toInstant().toEpochMilli(),b=d.plusDays(1).atStartOfDay(z).toInstant().toEpochMilli();
        JSONArray payments=actor==null?db.query("SELECT * FROM payments WHERE paid>=? AND paid<? ORDER BY paid DESC",a,b):db.query("SELECT * FROM payments WHERE paid>=? AND paid<? AND actor=? ORDER BY paid DESC",a,b,actor);
        JSONObject categories=new JSONObject(), employees=new JSONObject(); long total=0;
        for(String key:new String[]{"parking_hourly_normal","parking_hourly_preferred","time_free_normal","time_free_preferred","day_addon","wash_auto","wash_camioneta","wash_van","wash_pickup","pension_temporary","pension_monthly_12","pension_monthly_24","lost_card"}) categories.put(key,0);
        for(int i=0;i<payments.length();i++) { JSONObject p=payments.getJSONObject(i); total+=p.getLong("total"); employees.put(p.getString("actor"),employees.optLong(p.getString("actor"))+p.getLong("total")); JSONArray lines=new JSONArray(p.getString("lines")); for(int j=0;j<lines.length();j++) { JSONObject l=lines.getJSONObject(j); categories.put(l.getString("category"),categories.optLong(l.getString("category"))+l.getLong("cents")); } }
        JSONObject count=db.one("SELECT COUNT(*) AS n FROM stays WHERE entered>=? AND entered<? AND state<>'cancelled'",a,b), exits=db.one("SELECT COUNT(*) AS n FROM stays WHERE exited>=? AND exited<? AND state='closed'",a,b);
        return new JSONObject().put("date",date).put("categories",categories).put("employees",employees).put("total",total).put("payments",payments).put("entries",count.getInt("n")).put("exits",exits.getInt("n"));
    }
    public synchronized JSONArray pendingEvents() { return db.query("SELECT seq,event_id,body FROM outbox WHERE confirmed=0 ORDER BY seq LIMIT 50"); }
    private Map<String,String> params(String path) { Map<String,String> result=new HashMap<>(); for(String part:path.substring(path.indexOf('?')+1).split("&")) { String[] pair=part.split("=",2); if(pair.length==2) result.put(pair[0],pair[1]); } Rules.require(result.containsKey("from")&&result.containsKey("to"),"Indica inicio y fin del periodo."); return result; }
    public synchronized void confirmEvents(long seq) { db.exec("UPDATE outbox SET confirmed=1 WHERE seq<=?",seq); db.exec("INSERT OR REPLACE INTO meta VALUES('lastSync',?)",String.valueOf(now())); }
    public synchronized String meta(String id) { JSONObject row=db.one("SELECT value FROM meta WHERE id=?",id); return row==null?"":row.getString("value"); }
    public int recentConnections() {long at=now();return (int)clients.values().stream().filter(t->at-t<=180000).count();}
    public long lastBackup() {return backupAt;}
    public synchronized JSONObject occupancySnapshot() { JSONObject daily=report(today(),null); return new JSONObject().put("installation",meta("installation")).put("at",now()).put("occupancy",db.one("SELECT COUNT(*) AS n FROM stays WHERE state='active'").getInt("n")).put("entries",daily.getInt("entries")).put("exits",daily.getInt("exits")); }
    private Reply error(int status,String message) { Reply r=new Reply(new JSONObject().put("error",message)); r.status=status; return r; }
}
