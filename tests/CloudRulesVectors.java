import mx.eloeste.core.*;
import org.json.*;
import java.time.*;
import java.nio.file.*;
import java.util.*;
/** Independent Java oracle consumed by the Workers parity suite. No business data. */
public final class CloudRulesVectors {
 public static void main(String[] args)throws Exception{
  JSONObject config=Rules.defaults(),out=new JSONObject().put("config",config);JSONArray hours=new JSONArray(),quotes=new JSONArray();
  for(int legacy=0;legacy<3;legacy++){JSONObject c=new JSONObject(config.toString());if(legacy==1)c.remove("preferredFullHour");if(legacy==2){c.remove("normalFromStart");c.remove("preferredFullHour");}for(boolean pref:new boolean[]{false,true})for(long ms:new long[]{0,1,599999,600000,600001,3599999,3600000,3600001,4199999,4200000,4200001,7199999,7200000,7200001,17999999,18000000,43200000})hours.put(new JSONObject().put("config",c).put("elapsed",ms).put("preferred",pref).put("result",Rules.hourly(ms,pref,c)));}
  long entered=LocalDateTime.parse("2026-11-12T09:00").atZone(ZoneId.of(Rules.ZONE)).toInstant().toEpochMilli();
  for(boolean configured:new boolean[]{false,true})for(String mode:new String[]{"hourly","free","day_wash","wash_only","temporary","monthly"})for(boolean pref:new boolean[]{false,true})for(boolean lost:new boolean[]{false,true})for(String wash:new String[]{"","auto","camioneta","van","pickup"}){
   if((mode.equals("day_wash")||mode.equals("wash_only"))&&wash.isEmpty())continue;
   JSONObject c=new JSONObject(config.toString());if(configured)c.put("opening","08:00").put("closing","20:00").put("monthlyNightStart","20:00").put("monthlyNightEnd","08:00");
   JSONObject s=new JSONObject().put("mode",mode).put("wash",wash).put("preferred",pref).put("lostCard",lost).put("rates",c);Rules.attachCoverage(s,entered,c);
   if(mode.equals("monthly")){JSONObject contract=new JSONObject().put("id","synthetic-monthly").put("mode",config.getJSONArray("monthly").getJSONObject(pref?0:1).toString()).put("start_at",entered-86400000).put("end_at",entered+30L*86400000);Rules.attachMonthly(s,entered,contract,c);}
   JSONObject stay=new JSONObject().put("entered",entered).put("service",s.toString());for(long delta:new long[]{0,600000,600001,3600000,43200000,43200001,86400000})quotes.put(new JSONObject().put("stay",stay).put("at",entered+delta).put("result",Rules.quote(stay,entered+delta)));
  }
  out.put("hours",hours).put("quotes",quotes);Files.writeString(Paths.get(args[0]),out.toString());System.out.println("Java oracle: "+hours.length()+" hourly cases and "+quotes.length()+" full quotes.");
 }
}
