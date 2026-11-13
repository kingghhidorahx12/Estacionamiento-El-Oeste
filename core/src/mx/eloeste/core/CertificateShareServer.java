package mx.eloeste.core;

import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

/** Short-lived bootstrap, containing only the public certificate and installation help.
 * No API, database, cookies, credentials, redirects or arbitrary files are exposed. */
public final class CertificateShareServer implements Closeable {
    private final ServerSocket socket; private final byte[] certificate,help; private final String path="/"+Security.random();
    private final ExecutorService worker=Executors.newSingleThreadExecutor(); private final ScheduledExecutorService expiry=Executors.newSingleThreadScheduledExecutor();
    private volatile boolean active=true;
    public CertificateShareServer(byte[] certificate,String secureUrl,int port) throws IOException {
        if(!secureUrl.matches("https://[0-9.]+:8443")) throw new IllegalArgumentException("Dirección inválida");
        this.certificate=certificate.clone(); socket=new ServerSocket(); socket.setReuseAddress(true); socket.bind(new InetSocketAddress(port),4);
        String html="<!doctype html><html lang='es'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Conectar a El Oeste</title><body><h1>Conecta tu celular</h1><p>Este acceso temporal sólo entrega el certificado público de la tablet. No introduzcas aquí tu PIN.</p><ol><li><a href='"+path+"/El-Oeste-CA.cer'>Descargar El-Oeste-CA.cer</a>.</li><li>Comprueba la huella SHA-256 del certificado contra la que muestra físicamente la tablet. Si no coincide, no lo instales.</li><li>En iPhone: Ajustes → Perfil descargado → Instalar. Después, General → Información → Ajustes de confianza de los certificados y activa esta CA.</li><li>En Android: Ajustes → Seguridad → Instalar certificado → Certificado de CA. El nombre del menú depende del teléfono.</li></ol><p>Instálalo sólo en los teléfonos que usarán El Oeste. Autoriza esta instalación una vez por teléfono.</p><p>Cuando esté autorizado: <a href='"+secureUrl+"'>Abrir estacionamiento</a>.</p><p>Guarda esa dirección en tu pantalla de inicio. Tablet y celular deben usar el mismo Wi-Fi. Esta página de descarga caduca en 10 minutos.</p></body></html>";
        String style="<style>*{box-sizing:border-box}html{background:linear-gradient(140deg,#f6f9fc,#e2edf5);min-height:100%}body{max-width:520px;margin:24px auto;padding:27px 24px;font:15px/1.7 system-ui,sans-serif;color:#17374f;background:linear-gradient(125deg,#fff,#f2f7fb);border:1px solid #c8dce9;border-radius:14px;box-shadow:0 8px 28px #17374f12}header{font-family:Georgia,serif;font-size:23px;font-weight:bold;letter-spacing:3px;border-bottom:2px solid #d2a75d;padding-bottom:15px}h1{font-size:27px;line-height:1.25;letter-spacing:-.7px}p{color:#526e84;font-size:13px}ol{padding-left:23px}li{padding:9px 0}a{color:#18567f}a[href$='.cer']{display:block;background:linear-gradient(120deg,#ffe3a0,#f1c16a);color:#3f301a;border:1px solid #d6a650;padding:12px 15px;border-radius:7px;text-decoration:none;font-weight:600}p>a{display:block;text-align:center;padding:12px;background:linear-gradient(120deg,#28678e,#143e60);color:#fff8e7;text-decoration:none;border-radius:7px}@media(max-width:560px){body{margin:16px;max-width:none;padding:24px 21px}}</style>";
        help=html.replace("<body>",style+"<body><header>EL OESTE</header>").getBytes(StandardCharsets.UTF_8);
    }
    public String path() { return path; }
    public int port() { return socket.getLocalPort(); }
    public void start() {
        worker.execute(()->{ while(active) try(Socket s=socket.accept()) {
            s.setSoTimeout(3000); InputStream input=s.getInputStream(); ByteArrayOutputStream request=new ByteArrayOutputStream(); int ch;
            while((ch=input.read())!=-1&&ch!='\n'&&request.size()<2048) if(ch!='\r')request.write(ch);
            if(ch!='\n')continue; String line=request.toString("US-ASCII");
            int total=0,previous='\n';boolean complete=false;
            while(total++<8192&&(ch=input.read())!=-1){if(ch=='\r')continue;if(ch=='\n'&&previous=='\n'){complete=true;break;}previous=ch;}
            if(!complete)continue;
            boolean get=line.equals("GET "+path+" HTTP/1.1"),download=line.equals("GET "+path+"/El-Oeste-CA.cer HTTP/1.1");
            byte[] body=download?certificate:get?help:new byte[0];
            String header="HTTP/1.1 "+(get||download?"200 OK":"404 Not Found")+"\r\nContent-Type: "+(download?"application/x-x509-ca-cert":"text/html; charset=utf-8")+"\r\n"+(download?"Content-Disposition: attachment; filename=El-Oeste-CA.cer\r\n":"")+"Content-Length: "+body.length+"\r\nConnection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nReferrer-Policy: no-referrer\r\nContent-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'\r\n\r\n";
            OutputStream out=s.getOutputStream(); out.write(header.getBytes(StandardCharsets.US_ASCII)); out.write(body); out.flush();
        } catch(IOException ignored) {} });
        expiry.schedule(()->{try {close();}catch(IOException ignored){}},10,TimeUnit.MINUTES);
    }
    @Override public void close() throws IOException { active=false; socket.close(); worker.shutdownNow(); expiry.shutdownNow(); }
}
