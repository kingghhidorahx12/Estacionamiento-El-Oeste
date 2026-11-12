package mx.eloeste.servidor;

import android.content.*;
import java.net.*;
import java.io.*;
import org.json.*;
import mx.eloeste.core.*;

/** Optional, asynchronous, read-only cloud replica. Never required by a local transaction. */
final class RemoteSync implements Runnable {
    private final Context context; private final Api api; private int failures=0;
    RemoteSync(Context context,Api api) { this.context=context; this.api=api; }
    public void run() {
        android.content.SharedPreferences prefs=context.getSharedPreferences("private",0);
        String url=prefs.getString("syncUrl",""); if(url.isEmpty()) return;
        if(failures>0 && (System.currentTimeMillis()/60000)%(1L<<Math.min(failures,6))!=0) return;
        try {
            JSONArray rows=api.pendingEvents(),events=new JSONArray(); long seq=0;
            for(int i=0;i<rows.length();i++) { JSONObject row=rows.getJSONObject(i); events.put(new JSONObject(row.getString("body")).put("seq",row.getLong("seq"))); seq=row.getLong("seq"); }
            JSONObject body=new JSONObject().put("events",events).put("snapshot",api.occupancySnapshot());
            URL dest=new URL(url); if(!dest.getProtocol().equals("https")) return;
            javax.net.ssl.HttpsURLConnection c=(javax.net.ssl.HttpsURLConnection)dest.openConnection(); c.setConnectTimeout(10000); c.setReadTimeout(10000); c.setInstanceFollowRedirects(false); c.setRequestMethod("POST"); c.setDoOutput(true); c.setRequestProperty("Content-Type","application/json"); c.setRequestProperty("Authorization","Bearer "+prefs.getString("syncToken",""));
            byte[] bytes=body.toString().getBytes("UTF-8"); c.setFixedLengthStreamingMode(bytes.length); try(OutputStream out=c.getOutputStream()) { out.write(bytes); }
            if(c.getResponseCode()!=200) throw new IOException();
            ByteArrayOutputStream received=new ByteArrayOutputStream(); try(InputStream in=c.getInputStream()) { byte[] buffer=new byte[1024]; int n; while((n=in.read(buffer))!=-1) { if(received.size()+n>4096) throw new IOException(); received.write(buffer,0,n); } }
            JSONObject reply=new JSONObject(received.toString("UTF-8")); Rules.require(reply.optBoolean("ok") && reply.optInt("accepted",-1)==events.length(),"Confirmación remota inválida.");
            api.confirmEvents(seq); failures=0; c.disconnect();
        } catch(Exception e) { failures=Math.min(failures+1,6); }
    }
}
