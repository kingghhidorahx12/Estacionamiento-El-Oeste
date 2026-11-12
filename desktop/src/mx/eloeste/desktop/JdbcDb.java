package mx.eloeste.desktop;

import java.sql.*;
import org.json.*;
import mx.eloeste.core.Db;

public final class JdbcDb implements Db,AutoCloseable {
    private final Connection connection;
    public JdbcDb(String path) throws Exception { connection=DriverManager.getConnection("jdbc:sqlite:"+path); exec("PRAGMA journal_mode=WAL"); exec("PRAGMA foreign_keys=ON"); exec("PRAGMA busy_timeout=5000"); }
    private PreparedStatement prepare(String sql,Object...args) throws SQLException { PreparedStatement p=connection.prepareStatement(sql); for(int i=0;i<args.length;i++) p.setObject(i+1,args[i]); return p; }
    public JSONArray query(String sql,Object...args) { try(PreparedStatement p=prepare(sql,args); ResultSet rs=p.executeQuery()) { JSONArray rows=new JSONArray(); ResultSetMetaData m=rs.getMetaData(); while(rs.next()) { JSONObject row=new JSONObject(); for(int i=1;i<=m.getColumnCount();i++) row.put(m.getColumnLabel(i),rs.getObject(i)==null?JSONObject.NULL:rs.getObject(i)); rows.put(row); } return rows; } catch(SQLException e) { throw new IllegalStateException(e); } }
    public void exec(String sql,Object...args) { try(PreparedStatement p=prepare(sql,args)) { p.execute(); } catch(SQLException e) { throw new IllegalStateException(e); } }
    public void begin() { exec("BEGIN IMMEDIATE"); } public void commit() { exec("COMMIT"); } public void rollback() { exec("ROLLBACK"); }
    public void close() throws SQLException { connection.close(); }
}
