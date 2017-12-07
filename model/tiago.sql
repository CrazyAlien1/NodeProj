PROCEDURE table_extract (p_source_table VARCHAR2, p_DSA_table VARCHAR2, p_attributes_src VARCHAR2, p_attributes_dest VARCHAR2) IS
      v_end_date TIMESTAMP;
      v_start_date t_info_extractions.LAST_TIMESTAMP%TYPE;
      v_sql  VARCHAR2(1000);
   BEGIN 
      pck_log.write_log('  Extracting data ["TABLE_EXTRACT ('||UPPER(p_source_table)||')"]');
      pck_log.rowcount(p_DSA_table,'Before');    -- Logs how many rows the destination table initially contains

      -- CLEAN DESTINATION TABLE
      v_sql := 'DELETE FROM '||p_DSA_table;
      pck_log.write_log(v_sql);
      EXECUTE IMMEDIATE v_sql;

         --  find the date of change of the last record extracted in the previous extraction
         v_sql:='SELECT last_timestamp FROM t_info_extractions WHERE UPPER(source_table_name)='''||UPPER(p_source_table)||'''';
         pck_log.write_log(v_sql);
         EXECUTE IMMEDIATE v_sql INTO v_start_date;
         --    ---------------------
         --   |   FISRT EXTRACTION  |
         --    ---------------------

        IF v_start_date IS NULL THEN
        -- FIND THE DATE OF CHANGE OF THE MOST RECENTLY CHANGED RECORD IN THE SOURCE TABLE
            v_sql:='SELECT MAX(NVL(src_last_changed, ''10-01-01'')) FROM ' ||p_source_table;
            pck_log.write_log(v_sql);
            EXECUTE IMMEDIATE v_sql INTO v_end_date;

            -- EXTRACT ALL RELEVANT RECORDS FROM THE SOURCE TABLE TO THE DSA
            -- NAS VISTAS COM O src_last_changed A NULL O VALOR A INSERIR NA T_INFO_EXTRACTION Ã‰ NULL LOGO NÃƒO OFERECE VANTAGEM EM RELAÃ‡ÃƒO Ã€ EXTRAÃ‡ÃƒO NÃƒO INCREMENTAL
            v_sql:='INSERT INTO ' || p_dsa_table || '('|| p_attributes_dest ||')' ||
            'SELECT '|| p_attributes_src ||' FROM ' || p_source_table || ' WHERE NVL(src_last_changed, ''10-01-01'') <= :1';
            pck_log.write_log(v_sql);
            EXECUTE IMMEDIATE v_sql USING v_end_date;


            v_sql:='UPDATE t_info_extractions SET LAST_TIMESTAMP = :1 WHERE upper(SOURCE_TABLE_NAME) ='''||UPPER(p_source_table)||'''';
            EXECUTE IMMEDIATE v_sql USING v_end_date;
            pck_log.write_log(v_sql);
         ELSE
         --    -------------------------------------
         --   |  OTHER EXTRACTIONS AFTER THE FIRST  |
         --    -------------------------------------
            -- FIND THE DATE OF CHANGE OF THE MOST RECENTLY CHANGED RECORD IN THE SOURCE TABLE
            v_sql:='SELECT MAX (src_last_changed) FROM ' || p_source_table;
            pck_log.write_log(v_sql);
            EXECUTE IMMEDIATE v_sql INTO v_end_date; --USING v_start_date;

            IF v_end_date>v_start_date THEN
               -- EXTRACT ALL RELEVANT RECORDS FROM THE SOURCE TABLE TO THE DSA
               v_sql:='INSERT INTO ' || p_dsa_table || '('|| p_attributes_dest ||')' ||
               'SELECT '|| p_attributes_src ||' FROM ' || p_source_table || ' WHERE src_last_changed <= :1 AND src_last_changed > :2';
               pck_log.write_log(v_sql);
               EXECUTE IMMEDIATE v_sql USING v_end_date, v_start_date;

               -- UPDATE THE t_info_extractions TABLE
               v_sql:='UPDATE t_info_extractions SET LAST_TIMESTAMP = :1 WHERE upper(SOURCE_TABLE_NAME) ='''||UPPER(p_source_table)||'''';
               pck_log.write_log(v_sql);
               EXECUTE IMMEDIATE v_sql USING v_end_date;
            END IF;
         END IF;
      pck_log.write_log('    Done!');
      pck_log.rowcount(p_DSA_table,'After');    -- Logs how many rows the destination table now contains
   EXCEPTION
      WHEN OTHERS THEN
         pck_log.write_uncomplete_task_msg;
         RAISE e_extraction;
   END;