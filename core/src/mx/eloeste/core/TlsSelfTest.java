package mx.eloeste.core;

import java.io.*;
import java.net.*;
import java.security.*;
import java.security.cert.X509Certificate;
import java.util.concurrent.*;
import javax.net.ssl.*;

/** Exercises the actual platform TLS provider and opaque private key before reporting ready.
 * Trust is scoped to this in-process check; no system or browser trust is changed. */
public final class TlsSelfTest {
    public static final class Failure extends Exception {
        public final String code;
        private Failure(String code,Throwable cause) {super("Prueba de conexión segura: "+code,cause);this.code=code;}
    }
    private TlsSelfTest() {}
    public static void verify(SSLContext server,X509Certificate root) throws Failure {
        String stage="PREPARACION";
        ExecutorService worker=Executors.newSingleThreadExecutor(r->{Thread t=new Thread(r,"oeste-tls-check");t.setDaemon(true);return t;});
        try(SSLServerSocket listener=(SSLServerSocket)server.getServerSocketFactory().createServerSocket()) {
            listener.bind(new InetSocketAddress(InetAddress.getByName("127.0.0.1"),0),1); listener.setSoTimeout(5000);
            KeyStore trust=KeyStore.getInstance(KeyStore.getDefaultType());trust.load(null,null);trust.setCertificateEntry("local",root);
            TrustManagerFactory tm=TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());tm.init(trust);
            SSLContext client=SSLContext.getInstance("TLS");client.init(null,tm.getTrustManagers(),null);
            for(String protocol:new String[]{"TLSv1.2","TLSv1.3"}) {
                stage=protocol.equals("TLSv1.2")?"TLS12":"TLS13";
                Future<Void> serving=worker.submit(()->{
                    try(SSLSocket socket=(SSLSocket)listener.accept()) {
                        configure(socket,protocol,false);socket.startHandshake();socket.getOutputStream().write(79);socket.getOutputStream().flush();
                    }return null;
                });
                try(SSLSocket socket=(SSLSocket)client.getSocketFactory().createSocket("127.0.0.1",listener.getLocalPort())) {
                    configure(socket,protocol,true);socket.startHandshake();
                    if(socket.getInputStream().read()!=79)throw new IOException("TLS response incomplete");
                    serving.get(6,TimeUnit.SECONDS);
                } finally {serving.cancel(true);}
            }
        } catch(Exception e) {throw new Failure(stage,e);} finally {worker.shutdownNow();}
    }
    private static void configure(SSLSocket socket,String protocol,boolean client) throws IOException {
        socket.setUseClientMode(client);socket.setSoTimeout(5000);socket.setEnabledProtocols(new String[]{protocol});
        if(protocol.equals("TLSv1.2"))socket.setEnabledCipherSuites(new String[]{"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"});
        if(client){SSLParameters p=socket.getSSLParameters();p.setEndpointIdentificationAlgorithm("HTTPS");socket.setSSLParameters(p);}
    }
}
