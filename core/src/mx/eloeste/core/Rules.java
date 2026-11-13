package mx.eloeste.core;

import org.json.*;
import java.time.*;

public final class Rules {
    private Rules() {}
    public static final String ZONE = "America/Mexico_City";
    public static JSONObject defaults() {
        return new JSONObject("{\"ordinary\":1500,\"preferred\":1000,\"partial\":500,\"normalPartial\":1000,\"normalFromStart\":true,\"graceMinutes\":10,"
            + "\"wash\":{\"auto\":12000,\"camioneta\":17000,\"van\":17000,\"pickup\":20000},"
            + "\"dayAddon\":3000,\"freeNormal\":5000,\"freePreferred\":6000,\"opening\":null,\"closing\":null,"
            + "\"monthly\":[{\"id\":\"12h\",\"name\":\"Mensual 12 horas\",\"hours\":12,\"price\":50000},{\"id\":\"24h\",\"name\":\"Mensual 24 horas\",\"hours\":24,\"price\":60000}],"
            + "\"monthlyNightStart\":null,\"monthlyNightEnd\":null,\"monthlyPeriod\":null,"
            + "\"temporary\":{\"price\":10000,\"hours\":12,\"status\":\"provisional\"},\"lostCard\":10000}");
    }
    public static long hourly(long elapsedMs, boolean preferred, JSONObject c) {
        require(elapsedMs >= 0, "La salida no puede preceder a la entrada.");
        long rate = c.getLong(preferred ? "preferred" : "ordinary");
        if(!preferred&&c.optBoolean("normalFromStart")) {
            long whole=elapsedMs/3600000,rem=elapsedMs%3600000,window=c.getLong("graceMinutes")*60000;
            if(elapsedMs==0) return window>0?c.getLong("normalPartial"):rate;
            return whole*rate+(rem==0?0:rem<=window?c.getLong("normalPartial"):rate);
        }
        if (elapsedMs <= 3600000) return rate;
        long whole = elapsedMs / 3600000, rem = elapsedMs % 3600000;
        return whole * rate + (rem == 0 ? 0 : rem <= c.getLong("graceMinutes") * 60000 ? c.getLong("partial") : rate);
    }
    public static JSONObject line(String category, String label, long cents) {
        return new JSONObject().put("category", category).put("label", label).put("cents", cents);
    }
    public static JSONObject quote(JSONObject stay, long at) {
        JSONObject s = new JSONObject(stay.getString("service"));
        JSONObject c = s.getJSONObject("rates");
        long entered = stay.getLong("entered");
        require(at >= entered, "Reloj del servidor anterior a la entrada; requiere revisión.");
        JSONArray lines = new JSONArray();
        String mode = s.getString("mode"), reason = "";
        String wash = s.optString("wash", "");
        if (!wash.isEmpty()) lines.put(line("wash_" + wash, "Lavado · " + wash, c.getJSONObject("wash").getLong(wash)));
        if (mode.equals("hourly")) lines.put(line(s.optBoolean("preferred")?"parking_hourly_preferred":"parking_hourly_normal", "Estacionamiento " + (s.optBoolean("preferred") ? "preferencial" : "normal"), hourly(at-entered, s.optBoolean("preferred"), c)));
        else if (mode.equals("free")) {
            lines.put(line(s.optBoolean("preferred")?"time_free_preferred":"time_free_normal","Tiempo libre "+(s.optBoolean("preferred")?"preferencial":"normal"),c.getLong(s.optBoolean("preferred")?"freePreferred":"freeNormal")));
            reason=coverageReason(s,entered,at,"tiempo libre");
        }
        else if (mode.equals("day_wash")) {
            require(!wash.isEmpty(), "La jornada requiere lavado.");
            lines.put(line("day_addon", "Complemento de jornada", c.getLong("dayAddon")));
            reason=coverageReason(s,entered,at,"jornada con lavado");
        } else if(mode.equals("monthly")) {
            reason=coverageReason(s,entered,at,"pensión mensual");
        } else if (mode.equals("temporary")) {
            lines.put(line("pension_temporary", "Pensión temporal provisional", c.getJSONObject("temporary").getLong("price")));
            if (at > entered + c.getJSONObject("temporary").getLong("hours") * 3600000L) reason = "Excedente de pensión provisional. Requiere resolución administrativa.";
        } else require(mode.equals("wash_only"), "Modalidad inválida.");
        if (s.optBoolean("lostCard")) lines.put(line("lost_card", "Tarjeta extraviada", c.getLong("lostCard")));
        long total = 0; for (int i=0; i<lines.length(); i++) total += lines.getJSONObject(i).getLong("cents");
        return new JSONObject().put("lines", lines).put("total", total).put("blocked", !reason.isEmpty()).put("reason", reason).put("at", at);
    }
    public static void attachCoverage(JSONObject service, long entered, JSONObject config) {
        if (!service.getString("mode").equals("day_wash")&&!service.getString("mode").equals("free")) return;
        attachWindow(service,entered,config,"opening","closing");
    }
    private static String coverageReason(JSONObject s,long entered,long at,String name) {
        if(!s.has("coverageStart")||s.isNull("coverageStart")||s.isNull("coverageEnd")) return "Cobertura de "+name+" sin horario definido. Requiere resolución administrativa.";
        if(entered<s.getLong("coverageStart")||entered>s.getLong("coverageEnd")||at>s.getLong("coverageEnd")) return "Estancia fuera de la cobertura de "+name+". No hay recargo automático aprobado.";
        return "";
    }
    public static void attachMonthly(JSONObject s,long entered,JSONObject contract,JSONObject config) {
        JSONObject m=new JSONObject(contract.getString("mode"));
        require(m.has("hours"),"La modalidad de este registro anterior necesita definición administrativa antes de utilizar su cobertura.");
        s.put("monthlyId",contract.getString("id")).put("monthlyHours",m.getInt("hours"));
        if(m.getInt("hours")==24) s.put("coverageStart",contract.getLong("start_at")).put("coverageEnd",contract.getLong("end_at"));
        else {
            attachWindow(s,entered,config,"monthlyNightStart","monthlyNightEnd");
            if(!s.isNull("coverageStart")) s.put("coverageStart",Math.max(s.getLong("coverageStart"),contract.getLong("start_at"))).put("coverageEnd",Math.min(s.getLong("coverageEnd"),contract.getLong("end_at")));
        }
    }
    private static void attachWindow(JSONObject service,long entered,JSONObject config,String opening,String closing) {
        if (config.isNull(opening) || config.isNull(closing)) {
            service.put("coverageStart", JSONObject.NULL).put("coverageEnd", JSONObject.NULL); return;
        }
        LocalTime open = LocalTime.parse(config.getString(opening));
        LocalTime close = LocalTime.parse(config.getString(closing));
        require(!open.equals(close), "Apertura y cierre iguales no definen una jornada; no se asumen 24 horas.");
        ZoneId zone = ZoneId.of(ZONE);
        LocalDate date = Instant.ofEpochMilli(entered).atZone(zone).toLocalDate();
        if (close.isBefore(open) && !Instant.ofEpochMilli(entered).atZone(zone).toLocalTime().isAfter(close)) date = date.minusDays(1);
        long start = date.atTime(open).atZone(zone).toInstant().toEpochMilli();
        long end = (close.isAfter(open) ? date : date.plusDays(1)).atTime(close).atZone(zone).toInstant().toEpochMilli();
        service.put("coverageStart", start).put("coverageEnd", end);
    }
    public static void validateConfig(JSONObject c) {
        for (String key : new String[]{"ordinary","preferred","partial","dayAddon","lostCard","freeNormal","freePreferred"}) amount(c,key);
        if(c.optBoolean("normalFromStart")) require(amount(c,"normalPartial")<=c.getLong("ordinary"),"La fracción normal no puede superar la hora completa.");
        require(integer(c,"graceMinutes") >= 0 && c.getInt("graceMinutes") < 60, "Minutos parciales inválidos.");
        for (String type : new String[]{"auto","camioneta","van","pickup"}) amount(c.getJSONObject("wash"),type);
        require(c.getJSONArray("monthly").length() == 2, "Se requieren las dos modalidades mensuales.");
        java.util.HashSet<String> ids = new java.util.HashSet<>();
        for (int i=0; i<2; i++) { JSONObject m=c.getJSONArray("monthly").getJSONObject(i); amount(m,"price"); require(ids.add(m.getString("id")), "Modalidad duplicada."); require(!m.getString("name").trim().isEmpty(), "Nombre de modalidad requerido."); require(integer(m,"hours")==12||m.getInt("hours")==24,"Modalidad mensual de 12 o 24 horas."); }
        require(c.getJSONArray("monthly").getJSONObject(0).getInt("hours")!=c.getJSONArray("monthly").getJSONObject(1).getInt("hours"),"Se requieren modalidades de 12 y 24 horas distintas.");
        amount(c.getJSONObject("temporary"),"price");
        require(integer(c.getJSONObject("temporary"),"hours") > 0 && c.getJSONObject("temporary").getInt("hours") <= 744, "Duración temporal inválida.");
        require(c.isNull("opening") == c.isNull("closing"), "Define ambos horarios o deja ambos pendientes.");
        if (!c.isNull("opening")) { LocalTime a=LocalTime.parse(c.getString("opening")), b=LocalTime.parse(c.getString("closing")); require(!a.equals(b), "La jornada no se asume de 24 horas."); }
        require(c.isNull("monthlyNightStart")==c.isNull("monthlyNightEnd"),"Define ambos horarios nocturnos o deja ambos pendientes.");
        if(!c.isNull("monthlyNightStart")) { LocalTime a=LocalTime.parse(c.getString("monthlyNightStart")), b=LocalTime.parse(c.getString("monthlyNightEnd")); require((b.toSecondOfDay()-a.toSecondOfDay()+86400)%86400==43200,"La cobertura nocturna mensual debe abarcar las 12 horas confirmadas."); }
    }
    public static void money(long cents) { require(cents >= 0 && cents <= 100000000, "Importe fuera de rango."); }
    public static long integer(JSONObject object,String key) { Object raw=object.get(key); require(raw instanceof Number,"Se requiere un valor numérico: "+key); Number n=(Number)raw; require(Double.isFinite(n.doubleValue()) && n.doubleValue()==(double)n.longValue(),"Se requiere un entero exacto: "+key); return n.longValue(); }
    public static long amount(JSONObject object,String key) { long value=integer(object,key); money(value); return value; }
    public static void require(boolean ok, String message) { if (!ok) throw new IllegalArgumentException(message); }
}
