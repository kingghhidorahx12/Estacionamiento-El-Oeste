package mx.eloeste.desktop;

import java.nio.file.*;
import java.io.*;
import javax.net.ssl.SSLContext;
import mx.eloeste.core.*;

public final class Main {
    public static void main(String[] args) throws Exception {
        Path root=Paths.get("").toAbsolutePath(),data=root.resolve(System.getenv().getOrDefault("OESTE_DATA_DIR","data")); Files.createDirectories(data);
        JdbcDb db=new JdbcDb(data.resolve("oeste.sqlite").toString()); Api api=new Api(db);
        if(args.length>0&&args[0].equals("--setup-status")) { System.out.println(api.needsSetup()?"setup-required":"ready"); db.close(); return; }
        if(api.needsSetup()) {
            String name=System.getenv("OESTE_ADMIN_USER"),password=System.getenv("OESTE_ADMIN_PASSWORD");
            if(name==null||password==null) { Console c=System.console(); if(c==null) throw new IllegalStateException("Primera ejecución: usa scripts/start.ps1 para crear el administrador sin un PIN por defecto."); name=c.readLine("Usuario administrador: "); char[] chars=c.readPassword("PIN personal (6 a 12 dígitos): "); password=new String(chars); java.util.Arrays.fill(chars,'\0'); }
            api.bootstrap(name.trim().toLowerCase(java.util.Locale.ROOT),password);
        }
        SSLContext tls=null; String keystore=System.getenv("OESTE_TLS_P12");
        if(keystore!=null) try(InputStream in=Files.newInputStream(Paths.get(keystore))) { String password=System.getenv("OESTE_TLS_PASSWORD"); if(password==null) throw new IllegalStateException("Falta OESTE_TLS_PASSWORD"); tls=LocalServer.tls(in,password.toCharArray()); }
        int port=Integer.parseInt(System.getenv().getOrDefault("OESTE_PORT",tls==null?"8787":"8443"));
        Path webRoot=root.resolve("web").normalize();
        LocalServer server=new LocalServer(api,name->{ Path target=webRoot.resolve(name).normalize(); if(!target.startsWith(webRoot)) throw new IOException("Invalid static path"); return Files.readAllBytes(target); },port,tls); server.start();
        Runtime.getRuntime().addShutdownHook(new Thread(()->{ try { server.close(); db.close(); } catch(Exception ignored) {} }));
        System.out.println("El Oeste · "+(tls==null?"http://localhost:":"https://<IP-local>:")+server.port());
        System.out.println(tls==null?"Desarrollo: acceso exclusivo desde esta computadora. Para la red local configura HTTPS.":"Servidor TLS iniciado. Los teléfonos deben confiar en la CA local.");
        Thread.currentThread().join();
    }
}
