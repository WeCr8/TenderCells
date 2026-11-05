#!/usr/bin/env python3
import trimesh,sys
path=sys.argv[1] if len(sys.argv)>1 else '../Assets/TenderCells_Smart_Feeder_Interactive_v4.glb'
scene=trimesh.load(path,force='scene')
required={'Rotor','FeedFill','LoadCellPlatform','StatusLED','Hopper','FeedTrough','Stepper28BYJ48'}
nodes=set(scene.graph.nodes_geometry)
missing=required-nodes
print('nodes:',sorted(nodes))
if missing: raise SystemExit('Missing required nodes: '+', '.join(sorted(missing)))
print('PASS: required interactive nodes are present')
