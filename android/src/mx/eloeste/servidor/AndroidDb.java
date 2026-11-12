package mx.eloeste.servidor;

import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.*;
import mx.eloeste.core.Db;
import org.json.*;

public final class AndroidDb extends SQLiteOpenHelper implements Db {
    public AndroidDb(Context context) { super(context,"oeste.sqlite",null,1); setWriteAheadLoggingEnabled(true); }
    public void onCreate(SQLiteDatabase db) {} public void onUpgrade(SQLiteDatabase db,int oldVersion,int newVersion) { throw new IllegalStateException("Requiere migración explícita."); }
    public void onConfigure(SQLiteDatabase db) { db.setForeignKeyConstraintsEnabled(true); }
    public JSONArray query(String sql,Object...args) {
        String[] values=new String[args.length]; for(int i=0;i<args.length;i++) values[i]=String.valueOf(args[i]);
        JSONArray rows=new JSONArray();
        try(Cursor c=getReadableDatabase().rawQuery(sql,values)) {
            while(c.moveToNext()) { JSONObject row=new JSONObject(); for(int i=0;i<c.getColumnCount();i++) { Object v=c.isNull(i)?JSONObject.NULL:c.getType(i)==Cursor.FIELD_TYPE_INTEGER?c.getLong(i):c.getType(i)==Cursor.FIELD_TYPE_FLOAT?c.getDouble(i):c.getString(i); row.put(c.getColumnName(i),v); } rows.put(row); }
        } return rows;
    }
    public void exec(String sql,Object...args) { getWritableDatabase().execSQL(sql,args); }
    public void begin() { getWritableDatabase().beginTransaction(); }
    public void commit() { SQLiteDatabase d=getWritableDatabase(); d.setTransactionSuccessful(); d.endTransaction(); }
    public void rollback() { getWritableDatabase().endTransaction(); }
}
