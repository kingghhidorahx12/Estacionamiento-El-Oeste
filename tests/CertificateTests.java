import mx.eloeste.core.*;
import mx.eloeste.desktop.*;
import java.security.*;
import java.security.cert.*;
import java.net.*;
import java.io.*;
import java.util.*;
import javax.net.ssl.*;

/** Real TLS and standard PKIX validation, without changing system trust. */
public final class CertificateTests {
    static int checks; static void ok(boolean value,String message){checks++;if(!value)throw new AssertionError(message);}
    static KeyPair keys()throws Exception{KeyPairGenerator g=KeyPairGenerator.getInstance("RSA");g.initialize(2048);return g.generateKeyPair();}
    static SSLContext client(X509Certificate root)throws Exception{KeyStore trust=KeyStore.getInstance(KeyStore.getDefaultType());trust.load(null,null);trust.setCertificateEntry("local",root);TrustManagerFactory f=TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());f.init(trust);SSLContext ssl=SSLContext.getInstance("TLS");ssl.init(null,f.getTrustManagers(),null);return ssl;}
    static void handshake(SSLContext client,int port,String host,String protocol)throws Exception{try(SSLSocket s=(SSLSocket)client.getSocketFactory().createSocket(host,port)){s.setSoTimeout(5000);s.setEnabledProtocols(new String[]{protocol});SSLParameters params=s.getSSLParameters();params.setEndpointIdentificationAlgorithm("HTTPS");s.setSSLParameters(params);s.startHandshake();}}
    static byte[] get(int port,String path)throws Exception{HttpURLConnection c=(HttpURLConnection)new URL("http://127.0.0.1:"+port+path).openConnection();c.setReadTimeout(5000);try{return c.getInputStream().readAllBytes();}finally{c.disconnect();}}
    public static void main(String[] args)throws Exception{
        KeyPair ca=keys(),server=keys();Date now=new Date();X509Certificate root=CertificateIssuer.root(ca,"El Oeste CA ensayo",now),leaf=CertificateIssuer.server(server.getPublic(),ca.getPrivate(),root,List.of("192.168.1.20"),now);
        root.verify(ca.getPublic());leaf.verify(root.getPublicKey());root.checkValidity();leaf.checkValidity();ok(root.getBasicConstraints()==0,"CA with path length zero");ok(root.getKeyUsage()[5]&&root.getKeyUsage()[6],"root certificate signing usage");ok(leaf.getBasicConstraints()==-1,"leaf cannot issue certificates");ok(leaf.getKeyUsage()[0]&&leaf.getKeyUsage()[2],"TLS signature and key encipherment");ok(leaf.getExtendedKeyUsage().equals(List.of("1.3.6.1.5.5.7.3.1")),"server authentication only");
        CertPath path=CertificateFactory.getInstance("X.509").generateCertPath(List.of(leaf));PKIXParameters parameters=new PKIXParameters(Set.of(new TrustAnchor(root,null)));parameters.setRevocationEnabled(false);CertPathValidator.getInstance("PKIX").validate(path,parameters);ok(true,"standard PKIX verifies generated chain");
        KeyPair otherKeys=keys();X509Certificate other=CertificateIssuer.root(otherKeys,"El Oeste CA otra tablet",now);ok(!CertificateIssuer.fingerprint(root).equals(CertificateIssuer.fingerprint(other)),"different tablet identities");
        X509Certificate renewed=CertificateIssuer.server(server.getPublic(),ca.getPrivate(),root,List.of("192.168.1.21"),now);renewed.verify(root.getPublicKey());ok(!renewed.getSerialNumber().equals(leaf.getSerialNumber()),"renewed certificate unique serial");ok(renewed.getSubjectAlternativeNames().stream().anyMatch(n->n.get(1).equals("192.168.1.21")),"new Wi-Fi IP covered by same CA");ok(leaf.getNotAfter().getTime()-now.getTime()<=366L*86400000,"short-lived leaf");
        try(JdbcDb db=new JdbcDb(":memory:")){Api api=new Api(db);try(LocalServer local=new LocalServer(api,name->"ok".getBytes(),0,LocalServer.tls(server.getPrivate(),new X509Certificate[]{leaf,root}))){local.start();SSLContext trusted=client(root);handshake(trusted,local.port(),"localhost","TLSv1.3");ok(true,"TLS 1.3 with trusted CA and validated hostname");handshake(trusted,local.port(),"127.0.0.1","TLSv1.2");ok(true,"TLS 1.2 with validated loopback IP");try{handshake(client(other),local.port(),"localhost","TLSv1.3");throw new AssertionError("foreign CA accepted");}catch(SSLHandshakeException expected){ok(true,"untrusted installation rejected");}try{handshake(trusted,local.port(),"127.0.0.2","TLSv1.3");throw new AssertionError("wrong IP accepted");}catch(SSLHandshakeException expected){ok(true,"wrong IP rejected");}}}
        try(CertificateShareServer share=new CertificateShareServer(root.getEncoded(),"https://192.168.1.20:8443",0)){share.start();String help=new String(get(share.port(),share.path()),"UTF-8");ok(help.contains("No introduzcas aquí tu PIN")&&help.contains("SHA-256"),"bootstrap explains public-only trust ceremony");ok(Arrays.equals(get(share.port(),share.path()+"/El-Oeste-CA.cer"),root.getEncoded()),"exact public CA download");HttpURLConnection c=(HttpURLConnection)new URL("http://127.0.0.1:"+share.port()+"/api/state").openConnection();ok(c.getResponseCode()==404,"bootstrap never exposes financial API");c.disconnect();c=(HttpURLConnection)new URL("http://127.0.0.1:"+share.port()+share.path()).openConnection();c.setRequestMethod("POST");ok(c.getResponseCode()==404,"bootstrap rejects writes");c.disconnect();}
        System.out.println("PASS · "+checks+" verificaciones de certificados automáticos, PKIX, TLS y descarga pública limitada.");
    }
}
