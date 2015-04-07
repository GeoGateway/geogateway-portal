#!/usr/bin/env python
"""
    disloc2kml.py
     -- plot kml arrows from disloc output
"""

import os,sys,string,math
import argparse # new parser module

from kmlcircle import kml_arrow

# Jay's geo tools
from geogeo import Coord, RCoord
from Lxy import dxy2lat

def loaddislocouput(dislocoutput):
    """ load disloc output """

    with open(dislocoutput,"r") as f:
        lines = f.readlines()

    # find header_line number
    header_line = 0 
    for i in range(len(lines)): 
        if ('x' in lines[i]):
            header_line = i
            break 

    #print header_line
    headers = lines[:header_line]
    # first line, 161  161  38.220001  -122.313004
    first_line = headers[0].split()[:4]
    gridx,gridy, lon,lat = int(first_line[0]),int(first_line[1]),float(first_line[3]),float(first_line[2])

    # creat ref class
    ref_lonlat=Coord(lon,lat)
    rcoord = RCoord(0,0)
    arrow_data=[]
    for line in lines[header_line + 1:]:
        data = map(float,line.split())
        # x,y,ux,uy,uz
        x,y,ux,uy,uz = data[:5]
        # total displacement
        total_dis = math.sqrt(ux**2+uy**2)
        # convert x,y to lon,lat
        rcoord.x = x
        rcoord.y = y
        coord_lonlat = dxy2lat(ref_lonlat,[rcoord])[0][0]
        lon_x,lat_y=coord_lonlat.lon,coord_lonlat.lat
        # caculate angle
        angle = math.atan2(uy, ux) # atan(y / x), in radians. The result is between -pi and pi
        angle = math.degrees(angle)
        arrow_data.append([[lon_x,lat_y,total_dis,angle],[lon_x,lat_y,total_dis,angle,ux,uy,uz]])

    return arrow_data

def kml_header(name="",description=""):
    """ generate kml header """
    kmlheader = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Folder>
        <name>%s</name>
        <description><![CDATA[<strong>%s</strong>]]></description>
"""
    return kmlheader % (name, description)

def kml_footer():
    """ generate kml footer """

    kmlend="""</Folder></kml>"""

    return kmlend

def kml_folder(name = "",contents=""):
    """ return kml folders """
    kmlfolder = """
  <Folder>
    <name>%s</name>
    <visibility>1</visibility>
    <Style id="linestyle">
      <LineStyle>
        <color>ff00ffff</color>
        <width>2</width>
      </LineStyle>
    </Style>
    %s
  </Folder>
"""
    return kmlfolder % (name,contents)

def arrow_layer(arrow_num,desc_num,scale = 100):
    """ generate arrows """
    
    
    lon,lat,outer,degree = arrow_num
    arrow = kml_arrow(lon,lat,outer*scale,degree)
    
    name = "Grid Point:" + "%0.4f" % lon + "," + "%0.4f" % lat
    arrowkml = """
    <Placemark>
      <name>%s</name>
      <description>%s</description>
      <styleUrl>#linestyle</styleUrl>
       %s
    </Placemark>
    """
    lon,lat,total_dis,angle,ux,uy,uz = desc_num
    desc = "<b>location: " + "%.4f" % lon + "," + "%.4f" % lat + "</b><br />"
    desc += "<b>Total displacement: " +  "%.4f" % total_dis + " mm</b><br />"
    desc += "<b>Degree " +  "%.1f" % angle + "</b>"
    desc += "<b>East: " +  "%.4f" % ux + " mm</b><br />"
    desc += "<b>North: " +  "%.4f" % uy + " mm</b><br />"
    desc += "<b>Up: " +  "%.4f" % uz + " mm</b><br />"

    return arrowkml % (name, desc, arrow)


def kml_generator(dislocoutput,kml):
    """ generate kml output for arrows plot """

    # defult name is output.kml
    if kml == "":
        kml = dislocoutput + ".kml"

    data_plot = loaddislocouput(dislocoutput)

    count = 0
    arrow_str = ""
    for entry in data_plot:
        #skip, too many arrows
        if count % 10:
            count += 1
            continue 
        arrow_data = entry[0]
        desc_data = entry[1]
        arrow_str += arrow_layer(arrow_data,desc_data)
        count += 1 
    # write kml
    with open(kml,'w') as f:
        f.write(kml_header(name=dislocoutput))
        f.write(kml_folder("Displacement",arrow_str))
        f.write(kml_footer())
    f.closed

def main():

    if len(sys.argv) < 2:
        print __doc__
        sys.exit()

    # sample:
    # python updatemeta.py -f ann -d meta311/insar_311.sqlite -g thumbnail/boundary.geojson
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--dislocoutput", help="disloc output", default = "")
    parser.add_argument("-o", "--kml", help="kml output", default = "")

    args = parser.parse_args()

    V={}
    if args.dislocoutput == "":
        print "plese has a disloc output as input"
        sys.exit()
    if not args.kml:
        V['kml']=""
    else:
        V['kml']=args.kml   
                
    V['dislocoutput']=args.dislocoutput

    kml_generator(V['dislocoutput'],V['kml'])

 
if __name__ == "__main__":
    main()
