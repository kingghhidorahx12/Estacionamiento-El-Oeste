import mx.eloeste.core.*;
import mx.eloeste.desktop.*;
import javax.net.ssl.*;
import java.security.*;
import java.security.cert.*;
import java.io.*;
import java.net.*;
import org.json.*;

/** Requires only the isolated test CA; never alters the operating system trust store. */
public final class TransportTests {
    static int checks=0;
    static void ok(boolean value,String message){checks++;if(!value)throw new AssertionError(message);}
    public static void main(String[] args)throws Exception {
        System.setProperty("sun.net.http.allowRestrictedHeaders","true"); // Emit Origin in this non-browser test client.
        String password=System.getenv("OESTE_TEST_CERT_SECRET");
        SSLContext serverTls;try(InputStream in=new FileInputStream(".dev/tls-test/server.p12")){serverTls=LocalServer.tls(in,password.toCharArray());}
        KeyStore trusted=KeyStore.getInstance(KeyStore.getDefaultType());trusted.load(null,null);try(InputStream in=new FileInputStream(".dev/tls-test/El-Oeste-CA.cer")){trusted.setCertificateEntry("test-ca",CertificateFactory.getInstance("X.509").generateCertificate(in));}
        TrustManagerFactory manager=TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());manager.init(trusted);SSLContext client=SSLContext.getInstance("TLS");client.init(null,manager.getTrustManagers(),null);
        try(JdbcDb db=new JdbcDb(":memory:")) {Api api=new Api(db);api.bootstrap("transport","87654321");try(LocalServer server=new LocalServer(api,name->{if(!name.equals("index.html"))throw new IOException();return "<html>El Oeste</html>".getBytes("UTF-8");},0,serverTls)){
            server.start();String base="https://localhost:"+server.port();HttpsURLConnection home=(HttpsURLConnection)new URL(base+"/").openConnection();home.setSSLSocketFactory(client.getSocketFactory());ok(home.getResponseCode()==200,"TLS CA and hostname are valid without bypass");ok(home.getCipherSuite().contains("AES"),"encrypted transport");home.getInputStream().close();home.disconnect();
            HttpsURLConnection login=(HttpsURLConnection)new URL(base+"/api/login").openConnection();login.setSSLSocketFactory(client.getSocketFactory());login.setRequestMethod("POST");login.setDoOutput(true);login.setRequestProperty("Origin",base);login.setRequestProperty("Content-Type","application/json");try(OutputStream out=login.getOutputStream()){out.write("{\"name\":\"transport\",\"password\":\"87654321\"}".getBytes("UTF-8"));}ok(login.getResponseCode()==200,"login over trusted TLS");String cookie=login.getHeaderField("Set-Cookie");ok(cookie.contains("Secure")&&cookie.contains("HttpOnly")&&cookie.contains("SameSite=Strict"),"secure cookie flags");JSONObject response=new JSONObject(new String(login.getInputStream().readAllBytes(),"UTF-8"));ok(response.has("csrf"),"server creates CSRF token");login.disconnect();
            HttpsURLConnection state=(HttpsURLConnection)new URL(base+"/api/state").openConnection();state.setSSLSocketFactory(client.getSocketFactory());state.setRequestProperty("Cookie",cookie.split(";",2)[0]);ok(state.getResponseCode()==200,"authenticated HTTPS state");ok(state.getHeaderField("Cache-Control").equals("no-store"),"financial data not cached");state.getInputStream().close();state.disconnect();
            HttpsURLConnection bad=(HttpsURLConnection)new URL(base+"/api/login").openConnection();bad.setSSLSocketFactory(client.getSocketFactory());bad.setRequestMethod("POST");bad.setDoOutput(true);bad.setRequestProperty("Origin","https://other.invalid");try(OutputStream out=bad.getOutputStream()){out.write("{}".getBytes("UTF-8"));}ok(bad.getResponseCode()==403,"cross-origin write refused over TLS");bad.disconnect();
        }}System.out.println("PASS · "+checks+" verificaciones TLS con CA y nombre de host validados.");
    }
}
