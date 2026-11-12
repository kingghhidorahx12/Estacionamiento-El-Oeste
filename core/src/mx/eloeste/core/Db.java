package mx.eloeste.core;

import org.json.*;

/** Implementations serialize a transaction on one SQLite connection. */
public interface Db {
    JSONArray query(String sql, Object... args);
    void exec(String sql, Object... args);
    void begin();
    void commit();
    void rollback();
    default JSONObject one(String sql, Object... args) {
        JSONArray rows = query(sql, args);
        return rows.length() == 0 ? null : rows.getJSONObject(0);
    }
}
