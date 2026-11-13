package mx.eloeste.servidor;

import android.content.Context;
import android.net.*;
import android.security.keystore.*;
import android.util.AtomicFile;
import java.io.*;
import java.net.*;
import java.security.*;
import java.security.cert.*;
import java.util.*;
import javax.net.ssl.SSLContext;
import javax.security.auth.x500.X500Principal;
import mx.eloeste.core.*;
import mx.eloeste.core.Security;

/** One CA per installation. Private keys never leave the Android key store. */
final class LocalCertificates {
    private static final String ROOT="oeste-local-root-v1",LEAF="oeste-local-server-v1";
    static SortedSet<String> wifi(Context c) {
        SortedSet<String> ips=new TreeSet<>(); ConnectivityManager manager=c.getSystemService(ConnectivityManager.class);
        for(Network network:manager.getAllNetworks()) {
            NetworkCapabilities cap=manager.getNetworkCapabilities(network); LinkProperties links=manager.getLinkProperties(network);
            if(cap==null||links==null||!cap.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)||cap.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) continue;
            for(LinkAddress link:links.getLinkAddresses()) { InetAddress a=link.getAddress(); if(a instanceof Inet4Address&&!a.isLoopbackAddress()&&!a.isLinkLocalAddress()) ips.add(a.getHostAddress()); }
        } return ips;
    }
    static String url(Context c) { SortedSet<String> ips=wifi(c); return ips.isEmpty()?"":"https://"+ips.first()+":8443"; }
    static boolean expiring(Context c) throws Exception {
        if(new File(c.getFilesDir(),"server.p12").exists())return false;
        File leaf=new File(c.getFilesDir(),"local-server.cer");
        return !leaf.exists()||read(leaf).getNotAfter().getTime()<System.currentTimeMillis()+30L*86400000;
    }
    static synchronized SSLContext ensure(Context c) throws Exception {
        // Preserve certificates imported by an earlier version; never replace their trust identity silently.
        File legacy=new File(c.getFilesDir(),"server.p12");
        if(legacy.exists()) try(InputStream in=new FileInputStream(legacy)) { return LocalServer.tls(in,Vault.read(c).toCharArray()); }
        SortedSet<String> ips=wifi(c); Rules.require(!ips.isEmpty(),"Conecta la tablet al Wi-Fi del estacionamiento.");
        KeyStore store=KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        File rootFile=new File(c.getFilesDir(),"local-ca.cer"),leafFile=new File(c.getFilesDir(),"local-server.cer");
        Date now=new Date(); X509Certificate root;
        if(rootFile.exists()) {
            Rules.require(store.containsAlias(ROOT),"No está disponible la clave de esta instalación. Requiere revisión administrativa.");
            root=read(rootFile); root.checkValidity(now); root.verify(root.getPublicKey());
            Rules.require(root.getBasicConstraints()==0&&Arrays.equals(root.getPublicKey().getEncoded(),store.getCertificate(ROOT).getPublicKey().getEncoded()),"La identidad local requiere revisión administrativa.");
        } else {
            KeyPair pair=pair(store,ROOT,true); root=CertificateIssuer.root(pair,"El Oeste CA "+Security.random().substring(0,8),now);
            root.verify(pair.getPublic()); write(rootFile,root.getEncoded());
        }
        KeyPair leafKeys=pair(store,LEAF,false); X509Certificate leaf=leafFile.exists()?read(leafFile):null;
        String addresses=String.join(",",ips),stored=c.getSharedPreferences("private",0).getString("certificateIps","");
        if(leaf==null||!addresses.equals(stored)||leaf.getNotAfter().getTime()<now.getTime()+30L*86400000||!Arrays.equals(leaf.getPublicKey().getEncoded(),leafKeys.getPublic().getEncoded())) {
            leaf=CertificateIssuer.server(leafKeys.getPublic(),(PrivateKey)store.getKey(ROOT,null),root,ips,now);
            leaf.verify(root.getPublicKey()); write(leafFile,leaf.getEncoded());
            c.getSharedPreferences("private",0).edit().putString("certificateIps",addresses).apply();
        }
        leaf.checkValidity(now); leaf.verify(root.getPublicKey());
        return LocalServer.tls(leafKeys.getPrivate(),new X509Certificate[]{leaf,root});
    }
    private static KeyPair pair(KeyStore store,String alias,boolean ca) throws Exception {
        if(store.containsAlias(alias)) return new KeyPair(store.getCertificate(alias).getPublicKey(),(PrivateKey)store.getKey(alias,null));
        KeyPairGenerator generator=KeyPairGenerator.getInstance("RSA","AndroidKeyStore");
        KeyGenParameterSpec.Builder spec=new KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_SIGN|(ca?0:KeyProperties.PURPOSE_DECRYPT))
            .setKeySize(2048).setDigests(KeyProperties.DIGEST_SHA256,KeyProperties.DIGEST_SHA384,KeyProperties.DIGEST_SHA512)
            .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1,KeyProperties.SIGNATURE_PADDING_RSA_PSS)
            .setCertificateSubject(new X500Principal("CN=El Oeste local"));
        if(!ca) spec.setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_PKCS1);
        generator.initialize(spec.build()); return generator.generateKeyPair();
    }
    static byte[] publicCa(Context c) throws Exception { return read(new File(c.getFilesDir(),"local-ca.cer")).getEncoded(); }
    static String fingerprint(Context c) throws Exception { return CertificateIssuer.fingerprint(read(new File(c.getFilesDir(),"local-ca.cer"))); }
    private static X509Certificate read(File file) throws Exception { try(InputStream in=new FileInputStream(file)) { return (X509Certificate)CertificateFactory.getInstance("X.509").generateCertificate(in); } }
    private static void write(File file,byte[] bytes) throws IOException {
        AtomicFile atomic=new AtomicFile(file); FileOutputStream out=atomic.startWrite();
        try { out.write(bytes); atomic.finishWrite(out); } catch(IOException e) { atomic.failWrite(out); throw e; }
    }
}
