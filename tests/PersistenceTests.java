import mx.eloeste.core.*;
import mx.eloeste.desktop.*;
import org.json.*;
import java.nio.file.*;
import java.time.*;

public final class PersistenceTests {
    static int checks=0;static void ok(boolean v,String s){checks++;if(!v)throw new AssertionError(s);}
    public static void main(String[] args)throws Exception {
        Path path=Files.createTempFile(Paths.get(".dev"),"oeste-restart-",".sqlite");String id,receipt;long time=ZonedDateTime.of(2026,11,12,10,0,0,0,ZoneId.of(Rules.ZONE)).toInstant().toEpochMilli();String entryKey=OesteTests.key(),exitKey=OesteTests.key();JSONObject entry=OesteTests.entry(1,"hourly","");JSONObject exit;
        try {
            try(JdbcDb db=new JdbcDb(path.toString())){Api api=new Api(db,()->time);api.bootstrap("restart","87654321");OesteTests.Client c=new OesteTests.Client(api,"restart","87654321");Api.Reply created=c.post("entry",entry,entryKey);ok(created.status==200,"create disk-backed stay");id=created.json.getString("id");}
            try(JdbcDb db=new JdbcDb(path.toString())){Api api=new Api(db,()->time+1800000);ok(!api.needsSetup(),"account persists after connection closes");OesteTests.Client c=new OesteTests.Client(api,"restart","87654321");JSONObject state=c.get("state");ok(state.getJSONArray("stays").length()==1,"active stay survives reopen");ok(state.getJSONArray("cards").getJSONObject(0).getString("state").equals("assigned"),"card assignment survives reopen");ok(c.post("entry",entry,entryKey).json.getString("id").equals(id),"entry retry after restart does not duplicate");exit=OesteTests.checkout(id,1500);Api.Reply paid=c.post("checkout",exit,exitKey);ok(paid.status==200,"checkout after restart");receipt=paid.json.getString("id");}
            try(JdbcDb db=new JdbcDb(path.toString())){Api api=new Api(db,()->time+2000000);OesteTests.Client c=new OesteTests.Client(api,"restart","87654321");ok(c.get("state").getJSONArray("stays").length()==0,"closed state persists");ok(c.get("state").getJSONArray("cards").getJSONObject(0).getString("state").equals("available"),"card release persists");ok(c.post("checkout",exit,exitKey).json.getString("id").equals(receipt),"receipt retry after restart returns same payment");ok(c.get("report?date=2026-11-12").getLong("total")==1500,"exactly one persisted payment");ok(api.pendingEvents().length()==1,"durable sync queue survives reopen");}
        } finally {Files.deleteIfExists(path);Files.deleteIfExists(Paths.get(path+"-wal"));Files.deleteIfExists(Paths.get(path+"-shm"));}
        System.out.println("PASS · "+checks+" verificaciones de cierre y reapertura real de SQLite en disco.");
    }
}
