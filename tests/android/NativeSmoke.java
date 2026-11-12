package mx.eloeste.tests;
import android.app.*;
import android.content.*;
import android.os.*;
import org.json.*;
import java.io.*;
import mx.eloeste.core.*;
import mx.eloeste.servidor.*;

public final class NativeSmoke extends Instrumentation {
    int checks=0; void check(boolean value,String message) { checks++; if(!value) throw new AssertionError(message); }
    @Override public void onCreate(Bundle args) { super.onCreate(args); start(); }
    @Override public void onStart() { Bundle result=new Bundle(); AndroidDb db=null; try {
        Context c=getTargetContext(); db=new AndroidDb(c); Api api=new Api(db); if(api.needsSetup()) api.bootstrap("native_test","65432198");
        Api.Reply login=api.handle("POST","/api/login",new JSONObject().put("name","native_test").put("password","65432198"),"","","");check(login.status==200,"login Android org.json");String token=login.cookie,csrf=login.json.getString("csrf");
        Api.Reply state=api.handle("GET","/api/state",new JSONObject(),token,"","");check(state.status==200,"state with Android SQLite");check(state.json.getJSONArray("cards").length()==35,"cards");check(state.json.getJSONObject("config").isNull("opening"),"undefined coverage");
        JSONObject vehicle=new JSONObject().put("type","auto").put("plate","NAT-123").put("color","Blanco");JSONObject entry=new JSONObject().put("card",1).put("vehicle",vehicle).put("service",new JSONObject().put("mode","day_wash").put("wash","auto"));
        Api.Reply created=api.handle("POST","/api/entry",entry,token,csrf,Security.random());check(created.status==200,"native entry transaction "+created.json);String id=created.json.getString("id");
        JSONObject pay=new JSONObject().put("id",id).put("received",15000).put("expectedTotal",15000).put("vehicleConfirmed",true).put("resolution",new JSONObject().put("extraCents",0).put("reason","Prueba nativa de cobertura manual"));String request=Security.random();Api.Reply paid=api.handle("POST","/api/checkout",pay,token,csrf,request);check(paid.status==200,"native checkout "+paid.json);check(paid.json.getLong("total")==15000,"native correct amount");check(api.handle("POST","/api/checkout",pay,token,csrf,request).json.getString("id").equals(paid.json.getString("id")),"native replay");
        check(api.pendingEvents().length()==1,"native single outbox event");check(!api.pendingEvents().toString().contains("NAT-123"),"native privacy");
        try(InputStream in=getContext().getAssets().open("tls-test.p12")) { check(LocalServer.tls(in,"test-only-strong-password".toCharArray())!=null,"Android imports JDK PKCS12"); }
        Activity activity=startActivitySync(new Intent(c,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));check(activity!=null,"native Activity startup");runOnMainSync(()->activity.finish());
        result.putString("stream","PASS: "+checks+" verificaciones de SQLite, JSON, pagos, TLS y arranque Android.\n");finish(Activity.RESULT_OK,result);
    }catch(Throwable e){result.putString("stream","FAIL: "+e.getClass().getSimpleName()+": "+e.getMessage()+"\n");finish(Activity.RESULT_CANCELED,result);}finally{if(db!=null)db.close();} }
}
