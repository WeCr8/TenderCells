export type ResourceLibrary = {
  id: string;
  name: string;
  scope: string;
  formats: string[];
  homepage: string;
  machineReadable?: string;
  status: 'available' | 'reference';
};

/** Curated semantic and public reference sources used to normalize resource records. */
export const RESOURCE_LIBRARIES: ResourceLibrary[] = [
  {
    id: 'obo-envo',
    name: 'OBO Environment Ontology (ENVO)',
    scope: 'Habitats, environmental systems, components, and processes.',
    formats: ['OWL', 'OBO', 'JSON'],
    homepage: 'https://obofoundry.org/ontology/envo.html',
    machineReadable: 'http://purl.obolibrary.org/obo/envo.owl',
    status: 'available',
  },
  {
    id: 'planteome-po',
    name: 'Plant Ontology',
    scope: 'Plant structures and growth or development stages.',
    formats: ['OWL', 'OBO'],
    homepage: 'https://obofoundry.org/ontology/po.html',
    machineReadable: 'http://purl.obolibrary.org/obo/po.owl',
    status: 'available',
  },
  {
    id: 'planteome-peco',
    name: 'Plant Experimental Conditions Ontology (PECO)',
    scope: 'Plant treatments, environments, and experimental conditions.',
    formats: ['OWL', 'OBO'],
    homepage: 'https://obofoundry.org/ontology/peco.html',
    machineReadable: 'http://purl.obolibrary.org/obo/peco.owl',
    status: 'available',
  },
  {
    id: 'cgiar-agro',
    name: 'Agronomy Ontology (AgrO)',
    scope: 'Agronomic practices, processes, and field observations.',
    formats: ['OWL'],
    homepage: 'https://bigdata.cgiar.org/resources/agronomy-ontology/',
    machineReadable: 'http://purl.obolibrary.org/obo/agro.owl',
    status: 'available',
  },
  {
    id: 'ncbi-taxonomy',
    name: 'NCBI Taxonomy Ontology',
    scope: 'Stable taxonomic identifiers for animals, plants, rodents, and wildlife.',
    formats: ['OWL', 'OBO'],
    homepage: 'https://obofoundry.org/ontology/ncbitaxon.html',
    machineReadable: 'http://purl.obolibrary.org/obo/ncbitaxon.owl',
    status: 'available',
  },
  {
    id: 'fao-agrovoc',
    name: 'FAO AGROVOC',
    scope: 'Multilingual agricultural concepts and linked terminology.',
    formats: ['SKOS', 'RDF'],
    homepage: 'https://www.fao.org/agrovoc/',
    status: 'reference',
  },
  {
    id: 'gbif',
    name: 'GBIF Species Backbone',
    scope: 'Species matching, accepted names, synonyms, and occurrence context.',
    formats: ['REST', 'JSON'],
    homepage: 'https://www.gbif.org/developer/species',
    status: 'reference',
  },
];
