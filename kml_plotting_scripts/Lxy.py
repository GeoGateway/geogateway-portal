############ dlat2xy Calling details:
# takes ref = (lon, lat) and array of coords (lon,lat)
# produces array RCoords  , lens, strikes
#    (xs, ys) - dlat2xy(ref,coords)

from math import sqrt, pi
from geogeo import *
from geofunc import *


eqrad = 6378.139
flattening = 1.0/298.247
yfactor = 111.32

def deg2rad(arg):
    return pi*arg/180.0

def rad2deg(arg):
    return 180.0*arg/pi

def dlat2xy(ref,coords):
    eqrad = 6378.139
    flattening = 1.0/298.247
    yfactor = 111.32
    sinlat = sino(ref.lat)
    xfactor = deg2rad(1.0)*coso(ref.lat) * eqrad * \
         (1.0 - sinlat*sinlat*flattening)
    rcoords = []
    lengths = []
    strikes = []
    for c in coords: 
        x = (c.lon - ref.lon)*xfactor
        y = (c.lat - ref.lat)*yfactor
        len = sqrt(x*x + y*y)
        str = atan2o(x,y) 
        rco = RCoord(x,y)
        rcoords.append(rco)
        lengths.append(len)
        strikes.append(str)

    return (rco, lengths, strikes);

############ dxy2lat Calling details:
# (coords,lengths,strikes) = dxy2lat(ref,rcoords)
# rcoords consists of x, y distances in km from ref point.
# ref is (lon, lat) exactly as above


def dxy2lat(ref,rcoords):
    sinlat = sino(ref.lat)
    xfactor = deg2rad(1.0)*coso(ref.lat) * eqrad * \
       (1.0 - sinlat*sinlat*flattening)
    coords = []
    lengths = []
    strikes = []
    for r in rcoords:
        lon = r.x/xfactor + ref.lon
        lat = r.y/yfactor + ref.lat
        len = sqrt(r.x*r.x+r.y*r.y)
        str = atan2o(r.x,r.y)
        coords.append(Coord(lon,lat))
        lengths.append(len)
        strikes.append(str)

    return (coords,lengths,strikes)
