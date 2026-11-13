package mx.eloeste.core;

import java.net.URI;
import java.util.*;
import org.json.JSONObject;

/** Fixed distribution channel. Downloaded APKs also require Android signature verification. */
public final class UpdateManifest {
    public static final String SOURCE="https://raw.githubusercontent.com/kingghhidorahx12/Estacionamiento-El-Oeste/main/updates/latest.json";
    public static final long MAX_BYTES=64L*1024*1024;
    public final String version,url,sha256;public final long code,bytes;
    public UpdateManifest(JSONObject value) {
        version=value.getString("version");code=value.getLong("versionCode");url=value.getString("url");sha256=value.getString("sha256");bytes=value.getLong("bytes");
        Rules.require(version.matches("[0-9]{1,4}\\.[0-9]{1,4}\\.[0-9]{1,4}"),"Versión de actualización inválida.");
        Rules.require(code>0&&code<=Integer.MAX_VALUE&&bytes>=100000&&bytes<=MAX_BYTES&&sha256.matches("[a-f0-9]{64}"),"Actualización incompleta o demasiado grande.");
        String expected="https://github.com/kingghhidorahx12/Estacionamiento-El-Oeste/releases/download/v"+version+"/El-Oeste-"+version+"-pruebas.apk";
        Rules.require(url.equals(expected),"La actualización no pertenece al canal oficial de El Oeste.");
    }
    public static boolean downloadHost(String value) {
        try {URI u=URI.create(value);return "https".equals(u.getScheme())&&u.getUserInfo()==null&&(u.getPort()==-1||u.getPort()==443)&&Arrays.asList("raw.githubusercontent.com","github.com","release-assets.githubusercontent.com","objects.githubusercontent.com").contains(u.getHost());}catch(Exception e){return false;}
    }
}
