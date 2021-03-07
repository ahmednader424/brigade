import mysql.connector
import sys
import os
from time import gmtime, strftime, sleep, time
import pandas as pd
import json
import pandas.io.sql as sql
from pymysql import*
import datetime
import atexit






if __name__ == "__main__":
    # Read Inputs From JSON File
    f = open("configuration/Raid_Configuration.json")
    data = json.load(f)
    host = data['Host']
    user = data['User']
    password = data['Password']
    database = data['Database']
    table = data['Table'].split(',')
    valid = data['Valid_Tables']
    sleep_time = int(data['Recording_Interval_Time'])
    directory = data['Directory']
    f2 = open("raid_name.json")
    data2 = json.load(f2)
    raid_name = data2['name']
    if(not(os.path.isdir(directory))):
        os.mkdir(directory)

    # Connect the database to obtain the data to pandas dataframe
    con = connect(user=user, password=password, host=host,
                  database=database, autocommit=True)
    # Creating empty list which will contain dataframe for every table to be recorded
    l = []
    # initializing Empty Dataframes for every table
    for t in table:
        d = pd.DataFrame()
        l.append(d)
    print("Start Recording Raid")
    mydb = mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database,
    )
    curr = mydb.cursor()
    curr.execute('update system_mode set raid_recording =1;')
    curr.execute('update system_mode set raid_name ="%s" ;' % (raid_name,))
    mydb.commit()

    while(True):

        sleep(sleep_time)
        # Iterate in the tables to be recorded
        for t in table:

            # initialize an empty dataframe to fetch data
            current = pd.DataFrame()
            # a condition  to check if the table contains valid column
            if(valid[table.index(t)] == 1):
                # fetch the data
                current = sql.read_sql(
                    'select * from '+t+' where valid=1 ;', con)
            else:
                current = sql.read_sql('select * from '+t+';', con)
            # concatenate the current dataframe with the original dataframe made for the table
            l[table.index(t)] = pd.concat([l[table.index(t)], current], axis=0)

        raid = sql.read_sql('select raid_recording from system_mode', con)
        if(int(raid.iloc[0, 0]) == 1):
            continue
        else:
            break
    # Recording end time
    for t in table:
        # save the dataframe into a csv file
        l[table.index(t)].drop_duplicates().to_csv(
            directory+"\\"+raid_name+" "+t+".csv", index=False)
        # empty the dataframe to start recording again
        l[table.index(t)] = l[table.index(t)][0:0]
        print("table " + t + " Completed")
