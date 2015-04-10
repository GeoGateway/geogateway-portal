#!/usr/bin/env python

import sys
import math
import getopt

import Lxy
import geogeo

import numpy as np
import scipy.ndimage.filters as snf

def tiltmapoutput(input,output):
  """ generate tiltmap output """
  # modified from main()

  verbose  = False
  # Default UNIT = MM: Number of UNIT in one x/y grid spacing unit (KM)
  dispUnitConv = 1.0e6 #(MM/KM)

  lines = file(input, 'r').readlines()

  # x - east/west, y - north south
  gridTuple = lines[0].split()
  nXIter = int(gridTuple[0])
  nYIter = int(gridTuple[1])
  latRef = float(gridTuple[2])
  lonRef = float(gridTuple[3])

  ref = geogeo.Coord(lonRef, latRef)

  faultLoc   = lines[1].strip().split()

  i = 2
  line = lines[i]
  while not lines[i].strip().startswith('x'):
    i = i + 1

  iHeader    = i
  iDataStart = i + 1

  # lines 4+ contain data
  dataLines = lines[iDataStart:]

  # extract displacement (in MM)
  # Converted to MM from BASE UNIT by default BASE UNIT is MM
  convMultiplier = dispUnitConv / 1.0e6
  uxList =  [ (float(l.strip().split()[2]) * convMultiplier)
              for l in dataLines ]
  uyList =  [ (float(l.strip().split()[3]) * convMultiplier)
              for l in dataLines ]
  uzList =  [ (float(l.strip().split()[4]) * convMultiplier)
              for l in dataLines ]
  uzArr = np.array(uzList).reshape((nYIter, nXIter))

  # extract strain numbers
  exxList =  [ float(l.strip().split()[5]) for l in dataLines ]
  exxArr = np.array(exxList)
  exyList =  [ float(l.strip().split()[6]) for l in dataLines ]
  exyArr = np.array(exyList)
  eyyList =  [ float(l.strip().split()[7]) for l in dataLines ]
  eyyArr = np.array(eyyList)

  strainMagArr = np.sqrt(np.square(exxArr) +
                         np.square(eyyArr) +
                         2 * np.square(exyArr))

  # need x and y grid spacing
  # Converted to MM from KM by (x * 1e6)
  l0 = dataLines[0]
  l1 = dataLines[1]
  lx = dataLines[nXIter]
  xGridSpcM = (float(l1.strip().split()[0]) - float(l0.strip().split()[0]))*1.0e6 
               
  #print xGridSpcM
  yGridSpcM = (float(lx.strip().split()[1]) - float(l0.strip().split()[1]))*1.0e6

  #print yGridSpcM
  # compute vert disp (% slope) and direction
  # The division by 8.0 normalizes the output of the sobel
  # Test code:
  # m = [ ([ i ] * 10) for i in range(1,11) ]
  # snf.sobel(np.array(m), axis=0)
  # percentage slope in +y direction
  sr0 = 100.0 * snf.sobel(uzArr, axis=0)/(8.0 * yGridSpcM)
  # percentage slope in +x direction
  sr1 = 100.0 * snf.sobel(uzArr, axis=1)/(8.0 * xGridSpcM)

  # angle is, by default, in the down-slope direction needed for
  # drainage.
  um    = np.sqrt(np.square(sr0) + np.square(sr1))
  umDeg = ((180 * np.arctan2(sr0,sr1) / np.pi)) % 360.0

  # Original Line header:
  # x      y       ux        uy        uz        exx       exy       eyy
  # --location--  ----- displacement -----      -------- strain ---------
  headerList = lines[iHeader].strip().split()
  # Our Line header:
  # id, lat, lon, x, y, ux, uy, uz, horizDisp, horizDispAngle, slopePercnt,
  #   upSlopeAngle, exx, exy, eyy, strainMag

  # added id column to make ArcGIS happier
  outHeader = [ 'id', 'lat', 'lon' ]
  outHeader.extend(headerList[2:5])
  outHeader.extend(['horizDisp', 'horizDispAngle', 'slopePercnt',
                    'dnSlopeAngle'])
  outHeader.extend(headerList[5:])
  outHeader.extend(['totalDisp', 'strainMag'])
  outLineList = [ ','.join(outHeader) ]

  for i in range(len(dataLines)):
    line     = dataLines[i]
    slope    = um.flat[i]
    slopeDeg = umDeg.flat[i]
    
    lineSpl = line.strip().split()

    # convert x/y coords to lat/lon
    x = float(lineSpl[0])
    y = float(lineSpl[1])
    rcoords = [ geogeo.RCoord(x, y) ]
    (coords, lengths, strikes) = Lxy.dxy2lat(ref, rcoords)
    lat = coords[0].lat
    lon = coords[0].lon
    outLine = [ str(i+1), str(lat), str(lon) ]

    # insert ux, uy, uz
    outLine.extend(lineSpl[2:5])

    # compute and insert horizontal disp
    (ux, uy, uz) = [ float(v) for v in lineSpl[2:5] ]
    uh    = math.sqrt(ux * ux + uy * uy)
    uhDeg = (180.0 * math.atan2(uy, ux) / math.pi) % 360.0
    # print ux, uy, uh

    # insert uh, uhDeg, um, umDeg
    outLine.extend([str(uh), str(uhDeg), str(slope), str(slopeDeg)])

    # append remainder
    outLine.extend(lineSpl[5:])

    # append displacement magnitude
    outLine.extend([str(math.sqrt(ux*ux + uy*uy + uz*uz))])
   
    # append strainMag 
    outLine.extend([str(strainMagArr[i])])
   
    outLineList.append(','.join(outLine))

  outBuf = '\n'.join(outLineList)

  outFile = file(output, 'w')
  outFile.write(outBuf)
  outFile.close()

  return

def main():
  try:
    opts, args = getopt.getopt(sys.argv[1:], "hi:o:v", ["help", "output="])
  except getopt.GetoptError:
    # print help information and exit:
    usage()
    sys.exit(2)
  input    = None
  output   = None
  verbose  = False
  # Default UNIT = MM: Number of UNIT in one x/y grid spacing unit (KM)
  dispUnitConv = 1.0e6 #(MM/KM)
  for o, a in opts:
    if o == "-v":
      verbose = True
    if o in ("-h", "--help"):
      usage()
      sys.exit()
    if o in ("-o", "--output"):
      output = a
    if o == "-i":
      input = a
  # Remaining arguments are stored in: args (0 indexed)
  # ...
  if input is None:
    usage()
    sys.exit()
  if output is None:
    output = input + '.csv'

  lines = file(input, 'r').readlines()

  # x - east/west, y - north south
  gridTuple = lines[0].split()
  nXIter = int(gridTuple[0])
  nYIter = int(gridTuple[1])
  latRef = float(gridTuple[2])
  lonRef = float(gridTuple[3])

  ref = geogeo.Coord(lonRef, latRef)

  faultLoc   = lines[1].strip().split()

  i = 2
  line = lines[i]
  while not lines[i].strip().startswith('x'):
    i = i + 1

  iHeader    = i
  iDataStart = i + 1

  # lines 4+ contain data
  dataLines = lines[iDataStart:]

  # extract displacement (in MM)
  # Converted to MM from BASE UNIT by default BASE UNIT is MM
  convMultiplier = dispUnitConv / 1.0e6
  uxList =  [ (float(l.strip().split()[2]) * convMultiplier)
              for l in dataLines ]
  uyList =  [ (float(l.strip().split()[3]) * convMultiplier)
              for l in dataLines ]
  uzList =  [ (float(l.strip().split()[4]) * convMultiplier)
              for l in dataLines ]
  uzArr = np.array(uzList).reshape((nYIter, nXIter))

  # extract strain numbers
  exxList =  [ float(l.strip().split()[5]) for l in dataLines ]
  exxArr = np.array(exxList)
  exyList =  [ float(l.strip().split()[6]) for l in dataLines ]
  exyArr = np.array(exyList)
  eyyList =  [ float(l.strip().split()[7]) for l in dataLines ]
  eyyArr = np.array(eyyList)

  strainMagArr = np.sqrt(np.square(exxArr) +
                         np.square(eyyArr) +
                         2 * np.square(exyArr))

  # need x and y grid spacing
  # Converted to MM from KM by (x * 1e6)
  l0 = dataLines[0]
  l1 = dataLines[1]
  lx = dataLines[nXIter]
  xGridSpcM = (float(l1.strip().split()[0]) - float(l0.strip().split()[0]))*1.0e6 
               
  #print xGridSpcM
  yGridSpcM = (float(lx.strip().split()[1]) - float(l0.strip().split()[1]))*1.0e6

  #print yGridSpcM
  # compute vert disp (% slope) and direction
  # The division by 8.0 normalizes the output of the sobel
  # Test code:
  # m = [ ([ i ] * 10) for i in range(1,11) ]
  # snf.sobel(np.array(m), axis=0)
  # percentage slope in +y direction
  sr0 = 100.0 * snf.sobel(uzArr, axis=0)/(8.0 * yGridSpcM)
  # percentage slope in +x direction
  sr1 = 100.0 * snf.sobel(uzArr, axis=1)/(8.0 * xGridSpcM)

  # angle is, by default, in the down-slope direction needed for
  # drainage.
  um    = np.sqrt(np.square(sr0) + np.square(sr1))
  umDeg = ((180 * np.arctan2(sr0,sr1) / np.pi)) % 360.0

  # Original Line header:
  # x      y       ux        uy        uz        exx       exy       eyy
  # --location--  ----- displacement -----      -------- strain ---------
  headerList = lines[iHeader].strip().split()
  # Our Line header:
  # id, lat, lon, x, y, ux, uy, uz, horizDisp, horizDispAngle, slopePercnt,
  #   upSlopeAngle, exx, exy, eyy, strainMag

  # added id column to make ArcGIS happier
  outHeader = [ 'id', 'lat', 'lon' ]
  outHeader.extend(headerList[2:5])
  outHeader.extend(['horizDisp', 'horizDispAngle', 'slopePercnt',
                    'dnSlopeAngle'])
  outHeader.extend(headerList[5:])
  outHeader.extend(['totalDisp', 'strainMag'])
  outLineList = [ ','.join(outHeader) ]

  for i in range(len(dataLines)):
    line     = dataLines[i]
    slope    = um.flat[i]
    slopeDeg = umDeg.flat[i]
    
    lineSpl = line.strip().split()

    # convert x/y coords to lat/lon
    x = float(lineSpl[0])
    y = float(lineSpl[1])
    rcoords = [ geogeo.RCoord(x, y) ]
    (coords, lengths, strikes) = Lxy.dxy2lat(ref, rcoords)
    lat = coords[0].lat
    lon = coords[0].lon
    outLine = [ str(i+1), str(lat), str(lon) ]

    # insert ux, uy, uz
    outLine.extend(lineSpl[2:5])

    # compute and insert horizontal disp
    (ux, uy, uz) = [ float(v) for v in lineSpl[2:5] ]
    uh    = math.sqrt(ux * ux + uy * uy)
    uhDeg = (180.0 * math.atan2(uy, ux) / math.pi) % 360.0
    # print ux, uy, uh

    # insert uh, uhDeg, um, umDeg
    outLine.extend([str(uh), str(uhDeg), str(slope), str(slopeDeg)])

    # append remainder
    outLine.extend(lineSpl[5:])

    # append displacement magnitude
    outLine.extend([str(math.sqrt(ux*ux + uy*uy + uz*uz))])
   
    # append strainMag 
    outLine.extend([str(strainMagArr[i])])
   
    outLineList.append(','.join(outLine))

  outBuf = '\n'.join(outLineList)

  outFile = file(output, 'w')
  outFile.write(outBuf)
  outFile.close()

  return


def usage():
  print "\nqsxy2tilt.py -i <disloc_output> -o <output_csv_for_gis>\n"
  return
                
if (__name__ == "__main__"):
  #print 'executing main()...'
  main()
  #print 'completed main()'
