package mx.eloeste.core;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import javax.net.ssl.*;
import java.security.*;
import org.json.*;

/** Small bounded HTTP/1.1 server shared by Android and the desktop test host. TLS is mandatory on LAN. */
public final class LocalServer implements Closeable {
    public interface Assets { byte[] read(String name) throws IOException; }
    private final Api api; private final Assets assets; private final ServerSocket socket; private final boolean secure;
    private final ThreadPoolExecutor pool=new ThreadPoolExecutor(2,6,30,TimeUnit.SECONDS,new ArrayBlockingQueue<Runnable>(24));
    private volatile boolean running=true;
    public LocalServer(Api api, Assets assets, int port, SSLContext tls) throws IOException {
        this.api=api; this.assets=assets; secure=tls!=null;
        socket=tls==null?new ServerSocket():tls.getServerSocketFactory().createServerSocket();
        socket.setReuseAddress(true); socket.bind(new InetSocketAddress(tls==null?InetAddress.getLoopbackAddress():null,port),32);
        if(socket instanceof SSLServerSocket) ((SSLServerSocket)socket).setEnabledProtocols(new String[]{"TLSv1.2","TLSv1.3"});
    }
    public static SSLContext tls(InputStream p12,char[] password) throws Exception {
        KeyStore ks=KeyStore.getInstance("PKCS12"); ks.load(p12,password);
        KeyManagerFactory km=KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm()); km.init(ks,password);
        SSLContext context=SSLContext.getInstance("TLS"); context.init(km.getKeyManagers(),null,new SecureRandom()); return context;
    }
    public static SSLContext tls(PrivateKey key,java.security.cert.X509Certificate[] certificates) throws Exception {
        final java.security.cert.X509Certificate[] chain=certificates.clone();
        X509ExtendedKeyManager manager=new X509ExtendedKeyManager() {
            private String alias(String type) { return type!=null&&(type.equals("RSA")||type.equals("RSASSA-PSS"))?"oeste":null; }
            public String[] getClientAliases(String type,java.security.Principal[] issuers) { return null; }
            public String chooseClientAlias(String[] types,java.security.Principal[] issuers,Socket socket) { return null; }
            public String[] getServerAliases(String type,java.security.Principal[] issuers) { return alias(type)==null?null:new String[]{"oeste"}; }
            public String chooseServerAlias(String type,java.security.Principal[] issuers,Socket socket) { return alias(type); }
            public String chooseEngineServerAlias(String type,java.security.Principal[] issuers,SSLEngine engine) { return alias(type); }
            public java.security.cert.X509Certificate[] getCertificateChain(String name) { return "oeste".equals(name)?chain.clone():null; }
            public PrivateKey getPrivateKey(String name) { return "oeste".equals(name)?key:null; }
        };
        SSLContext context=SSLContext.getInstance("TLS"); context.init(new KeyManager[]{manager},null,new SecureRandom()); return context;
    }
    public void start() { Thread t=new Thread(()->{ while(running) try { Socket client=socket.accept(); try { pool.execute(()->serve(client)); } catch(RejectedExecutionException ex) { client.close(); } } catch(IOException ex) { if(running) System.err.println("Local listener unavailable"); } },"oeste-listener"); t.setDaemon(true); t.start(); }
    public int port() { return socket.getLocalPort(); }
    private String line(InputStream in,int limit) throws IOException { ByteArrayOutputStream b=new ByteArrayOutputStream(); int c; while((c=in.read())!=-1) { if(c=='\n') break; if(c!='\r') b.write(c); if(b.size()>limit) throw new IOException("Header too long"); } return c==-1&&b.size()==0?null:b.toString("US-ASCII"); }
    private void serve(Socket client) {
        try(Socket s=client) {
            s.setSoTimeout(10000); InputStream in=new BufferedInputStream(s.getInputStream()); OutputStream out=s.getOutputStream();
            boolean apiRequest=false;
            try {
            String first=line(in,2048); if(first==null) return; String[] req=first.split(" "); if(req.length!=3) { send(out,400,"text/plain",new byte[0],null); return; }
            String method=req[0],path=req[1]; Map<String,String> h=new HashMap<>(); String l; int bytes=0;
            while((l=line(in,4096))!=null&&!l.isEmpty()) { bytes+=l.length(); if(bytes>16384) throw new IOException("Headers too long"); int colon=l.indexOf(':'); if(colon<=0) throw new IOException("Invalid header"); String key=l.substring(0,colon).toLowerCase(Locale.ROOT); if(h.containsKey(key)) throw new IOException("Duplicate header"); h.put(key,l.substring(colon+1).trim()); }
            String host=h.getOrDefault("host","");
            if(host.isEmpty() || (!secure && !(host.equals("localhost:"+port())||host.equals("127.0.0.1:"+port())||host.equals("[::1]:"+port())))) { send(out,403,"text/plain",new byte[0],null); return; }
            if(h.containsKey("transfer-encoding")) { send(out,400,"text/plain",new byte[0],null); return; }
            if(path.startsWith("/api/")) {
                apiRequest=true;
                if(!method.equals("GET") && !((secure?"https://":"http://")+host).equals(h.get("origin"))) { send(out,403,"application/json","{\"error\":\"Origen no permitido.\"}".getBytes(StandardCharsets.UTF_8),null); return; }
                int length=Integer.parseInt(h.getOrDefault("content-length","0")); if(length<0||length>(path.equals("/api/restore")?12*1024*1024:65536)) { send(out,413,"text/plain",new byte[0],null); return; }
                byte[] raw=new byte[length]; int offset=0; while(offset<length) { int n=in.read(raw,offset,length-offset); if(n<0) throw new EOFException(); offset+=n; }
                JSONObject body=new JSONObject(); if(length>0) try { body=new JSONObject(new String(raw,StandardCharsets.UTF_8)); } catch(JSONException ex) { send(out,400,"application/json","{\"error\":\"JSON inválido.\"}".getBytes(StandardCharsets.UTF_8),null); return; }
                String token=""; for(String cookie:h.getOrDefault("cookie","").split(";")) if(cookie.trim().startsWith("oeste=")) token=cookie.trim().substring(6);
                Api.Reply reply=api.handle(method,path,body,token,h.getOrDefault("x-csrf",""),h.getOrDefault("idempotency-key",""),h.getOrDefault("x-activity","").equals("1"),h.getOrDefault("x-client",""));
                String cookie=reply.cookie==null?null:"oeste="+reply.cookie+"; Path=/; HttpOnly; SameSite=Strict; Max-Age="+(reply.cookie.isEmpty()?"0":"43200")+(secure?"; Secure":"");
                send(out,reply.status,"application/json; charset=utf-8",reply.json.toString().getBytes(StandardCharsets.UTF_8),cookie); return;
            }
            if(!method.equals("GET") && !method.equals("HEAD")) { send(out,405,"text/plain",new byte[0],null); return; }
            String name=path.split("\\?",2)[0]; if(name.equals("/")) name="/index.html";
            if(!name.matches("/[a-zA-Z0-9_./-]+")||name.contains("..")||name.startsWith("//")) { send(out,404,"text/plain",new byte[0],null); return; }
            try { byte[] file=assets.read(name.substring(1)); String type=name.endsWith(".html")?"text/html; charset=utf-8":name.endsWith(".css")?"text/css":name.endsWith(".js")?"text/javascript":name.endsWith(".svg")?"image/svg+xml":name.endsWith(".png")?"image/png":name.endsWith(".ttf")?"font/ttf":name.endsWith(".wasm")?"application/wasm":name.endsWith(".webmanifest")?"application/manifest+json":"application/octet-stream"; send(out,200,type,file,null); }
            catch(IOException ex) { send(out,404,"text/plain","No encontrado".getBytes(StandardCharsets.UTF_8),null); }
            } catch(Exception ex) {
                if(apiRequest)try{send(out,500,"application/json; charset=utf-8","{\"error\":\"La tablet no pudo procesar la solicitud. Reintenta con el mismo identificador.\"}".getBytes(StandardCharsets.UTF_8),null);}catch(IOException ignored){}
            }
        } catch(Exception ex) { /* Never log passwords, cookies, vehicles or request bodies. */ }
    }
    private void send(OutputStream out,int status,String type,byte[] body,String cookie) throws IOException {
        String headers="HTTP/1.1 "+status+" "+(status==200?"OK":"Error")+"\r\nContent-Type: "+type+"\r\nContent-Length: "+body.length+"\r\nConnection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nPermissions-Policy: camera=(self), microphone=(), geolocation=()\r\nContent-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'\r\n"+(cookie==null?"":"Set-Cookie: "+cookie+"\r\n")+"\r\n";
        out.write(headers.getBytes(StandardCharsets.US_ASCII)); out.write(body); out.flush();
    }
    public void close() throws IOException { running=false; socket.close(); pool.shutdownNow(); }
}
