<script>
  import { creator } from "../stores/creator.js";
  import CardHistory from "./CardHistory.svelte";
  import pokemon from "pokemontcgsdk";

  $: currentCardId = $creator.card.id;

  let activeTab = "upload";
  let isDragging = false;
  let searchQuery = "";
  let searchResults = [];
  let isSearching = false;
  let searchError = false;
  let searchTimer;

  pokemon.configure({ apiKey: import.meta.env.VITE_API_KEY || "" });

  // ── Traductions FR → EN les plus courantes ────────────────
  const FR_TO_EN = {
      "Aromatisse": "aromatisse",
      "Cléfable": "clawitzer",
      "abo": "ekans",
      "abra": "abra",
      "absol": "absol",
      "aegislash": "aegislash",
      "aeromite": "venomoth",
      "aipom": "aipom",
      "airmure": "skarmory",
      "akwakwak": "golduck",
      "alakazam": "alakazam",
      "alcremie": "alcremie",
      "aligatueur": "feraligatr",
      "alomomola": "alomomola",
      "altaria": "altaria",
      "ambipom": "ambipom",
      "amonistar": "omastar",
      "amonita": "omanyte",
      "amoonguss": "amoonguss",
      "amphinobi": "greninja",
      "annihilape": "annihilape",
      "anorith": "anorith",
      "apireine": "vespiquen",
      "apitrini": "combee",
      "appletun": "appletun",
      "applin": "applin",
      "aquajou": "panpour",
      "aquali": "vaporeon",
      "arachniveil": "araquanid",
      "araqua": "wishiwashi",
      "arbok": "arbok",
      "arboliva": "arboliva",
      "arcanin": "arcanine",
      "arceus": "arceus",
      "archéduc": "decidueye",
      "arcko": "treecko",
      "arctibax": "arctibax",
      "arctovish": "arctovish",
      "arctozolt": "arctozolt",
      "armaldo": "armaldo",
      "armarouge": "armarouge",
      "aron": "aron",
      "arrokuda": "arrokuda",
      "arsoeux": "drizzile",
      "artikodin": "articuno",
      "aspicot": "weedle",
      "avaltout": "swalot",
      "axew": "axew",
      "axoloto": "wooper",
      "azelf": "azelf",
      "azumarill": "azumarill",
      "azurill": "azurill",
      "aéromite": "venomoth",
      "badaboum": "bewear",
      "balourdo": "crabrawler",
      "baorpël": "spritzee",
      "barbaracle": "barbaracle",
      "barbicha": "barboach",
      "barraskewda": "barraskewda",
      "basculegion": "basculegion",
      "bastiodon": "bastiodon",
      "batracné": "palpitoad",
      "baxcalibur": "baxcalibur",
      "belebellus": "bellossom",
      "bellibolt": "bellibolt",
      "bibichut": "bidoof",
      "blindalys": "silcoon",
      "blindépique": "chesnaught",
      "blissey": "blissey",
      "blizzaroi": "froslass",
      "bocagrin": "grotle",
      "bolthund": "bolthund",
      "bombirdier": "bombirdier",
      "bonsly": "bonsly",
      "boréas": "tornadus",
      "bouchédo": "mudbray",
      "bourrignon": "quilladin",
      "braisillon": "pansear",
      "braivejou": "simisear",
      "brambleghast": "brambleghast",
      "bramblin": "bramblin",
      "branette": "banette",
      "brasegali": "blaziken",
      "brindibou": "rowlet",
      "brouhabam": "exploud",
      "bruinard": "swellow",
      "brute bonnet": "brute bonnet",
      "bruxish": "bruxish",
      "bulbizarre": "bulbasaur",
      "bélébellus": "bellossom",
      "bétarmé": "conkeldurr",
      "bétochef": "gurdurr",
      "cabriolette": "gogoat",
      "cacnea": "cacnea",
      "cacturne": "cacturne",
      "cadoizo": "delibird",
      "calyrex": "calyrex",
      "camerupt": "camerupt",
      "canarticho": "farfetch'd",
      "caninos": "salazzle",
      "capsakid": "capsakid",
      "carabaffe": "wartortle",
      "carapuce": "squirtle",
      "carvanha": "carvanha",
      "castorno": "bibarel",
      "caïpike": "elgyem",
      "celebi": "celebi",
      "centiskorch": "centiskorch",
      "ceriflor": "cherrim",
      "cerinol": "cherubi",
      "ceruledge": "ceruledge",
      "cetitan": "cetitan",
      "cetoddle": "cetoddle",
      "chamallot": "numel",
      "chapignon": "breloom",
      "charbambin": "nickit",
      "charcadet": "charcadet",
      "charmillon": "plusle",
      "charmilly": "chewtle",
      "chenipan": "caterpie",
      "chenipotte": "wurmple",
      "cheniti": "burmy",
      "chetiflor": "bellsprout",
      "chi-yu": "chi-yu",
      "chien-pao": "chien-pao",
      "chimerange": "throh",
      "chimpenfeu": "monferno",
      "chochodile": "fuecoco",
      "chrysacier": "metapod",
      "chuchmur": "chimecho",
      "chétiflor": "bellsprout",
      "cisayox": "scizor",
      "clamiral": "samurott",
      "clamperl": "clamperl",
      "clobbopus": "clobbopus",
      "clodsire": "clodsire",
      "coalossal": "coalossal",
      "cobalion": "cobalion",
      "coconfort": "kakuna",
      "coiffeton": "quaxly",
      "coiféret": "quaxwell",
      "cokiyas": "cascoon",
      "colombeau": "tranquill",
      "colossinge": "primeape",
      "combusken": "combusken",
      "copperajah": "copperajah",
      "corail": "lileep",
      "corayon": "cradily",
      "cornbre": "murkrow",
      "cornèbre": "murkrow",
      "corphish": "corphish",
      "corsola": "corsola",
      "corvaillus": "corviknight",
      "corvisquire": "corvisquire",
      "cosmog": "cosmog",
      "cosmoïem": "cosmoem",
      "cosolter": "mareanie",
      "cotovol": "eldegoss",
      "courbajou": "simipour",
      "couverdure": "swadloon",
      "coxy": "spinarak",
      "coxyclope": "ariados",
      "cramorant": "cramorant",
      "crapustule": "seismitoad",
      "cresselia": "cresselia",
      "creusefer": "drilbur",
      "croagunk": "croagunk",
      "crocalor": "crocalor",
      "crocrodil": "carnivine",
      "croâporal": "frogadier",
      "crustabri": "cloyster",
      "cryogonal": "cryogonal",
      "cubifu": "cubchoo",
      "cufant": "cufant",
      "cyclizar": "cyclizar",
      "célébi": "celebi",
      "dachsbun": "dachsbun",
      "dankeel": "whiscash",
      "dardargnan": "beedrill",
      "darkrai": "darkrai",
      "darumacho": "darmanitan",
      "darumarond": "darumaka",
      "deino": "deino",
      "delcatty": "delcatty",
      "demanta": "mantine",
      "demolosse": "houndoom",
      "deoxys": "deoxys",
      "dhelmise": "dhelmise",
      "dialga": "dialga",
      "diancie": "diancie",
      "dinoclier": "shieldon",
      "dipplin": "dipplin",
      "dodrio": "dodrio",
      "doduo": "doduo",
      "dolliv": "dolliv",
      "dondozo": "dondozo",
      "donphan": "stantler",
      "dottler": "dottler",
      "draby": "bagon",
      "dracaufeu": "charizard",
      "draco": "dragonair",
      "dracolosse": "dragonite",
      "dracovish": "dracovish",
      "dracozolt": "dracozolt",
      "dragadoon": "dragalge",
      "dragapult": "dragapult",
      "draioul": "druddigon",
      "drakloak": "drakloak",
      "drampa": "drampa",
      "drapion": "drapion",
      "drattak": "salamence",
      "draïeul": "druddigon",
      "dreepy": "dreepy",
      "drifblim": "drifblim",
      "dudunsparce": "dudunsparce",
      "dunsprace": "dunsparce",
      "duraludon": "duraludon",
      "dusknoir": "dusknoir",
      "dynavolt": "electrike",
      "déino": "deino",
      "délibo": "stufful",
      "démanta": "mantine",
      "démolosse": "houndoom",
      "démétéros": "landorus",
      "ecailler": "grovyle",
      "ecrevisso": "crawdaunt",
      "ectoplasma": "gengar",
      "efflèche": "dartrix",
      "eiscue": "eiscue",
      "electabuzz": "electabuzz",
      "electhor": "zapdos",
      "electrode": "electrode",
      "elekable": "electivire",
      "elekid": "elekid",
      "embrylex": "larvitar",
      "empiflor": "victreebel",
      "enamorus": "enamorus",
      "entei": "entei",
      "escadrill": "escavalier",
      "escargaume": "accelgor",
      "espathra": "espathra",
      "espéon": "espurr",
      "eternatus": "eternatus",
      "etouraptor": "staraptor",
      "etourchak": "staravia",
      "etourmi": "starly",
      "evoli": "eevee",
      "excadrill": "excadrill",
      "excavarène": "diggersby",
      "excelangue": "lickitung",
      "falinks": "falinks",
      "fangoss": "smeargle",
      "fantominus": "gastly",
      "farfuret": "sneasel",
      "farigiraf": "farigiraf",
      "ferniard": "bisharp",
      "ferosinge": "mankey",
      "ferroseed": "ferroseed",
      "ferrothorne": "ferrothorn",
      "feuforeve": "misdreavus",
      "feuforêve": "misdreavus",
      "feuillajou": "simisage",
      "feunard": "ninetales",
      "feunnec": "fennekin",
      "feurisson": "quilava",
      "fezandipiti": "fezandipiti",
      "fidough": "fidough",
      "finizen": "finizen",
      "finneon": "finneon",
      "finnéon": "finneon",
      "flagadoss": "slowbro",
      "flamands": "emboar",
      "flambaret": "fletchinder",
      "flambino": "scorbunny",
      "flambusard": "fletchling",
      "flamiaou": "litten",
      "flamigo": "flamigo",
      "flapple": "flapple",
      "flittle": "flittle",
      "floette": "flabébé",
      "floragato": "floragato",
      "floramantis": "lurantis",
      "floravol": "leavanny",
      "florges": "florges",
      "florizarre": "venusaur",
      "flozelle": "floatzel",
      "flutter mane": "flutter mane",
      "flétchargo": "talonflame",
      "foretress": "forretress",
      "fouinar": "furret",
      "fouinette": "sentret",
      "fragilady": "lilligant",
      "frigibax": "frigibax",
      "frillen": "lillipup",
      "frismousse": "frillish",
      "frosmoth": "frosmoth",
      "fuego": "audino",
      "fulguris": "thundurus",
      "funecire": "surskit",
      "fuécoco": "skiddo",
      "félinferno": "incineroar",
      "férosinge": "mankey",
      "galame": "snover",
      "galeking": "aggron",
      "gallame": "gallade",
      "galopa": "rapidash",
      "galvantula": "galvantula",
      "galvaran": "whismur",
      "garganacl": "garganacl",
      "genesect": "genesect",
      "germignon": "chikorita",
      "germélo": "whirlipede",
      "gholdengo": "gholdengo",
      "gigalithe": "gigalith",
      "gimmighoul": "gimmighoul",
      "girafarig": "girafarig",
      "giratina": "giratina",
      "givrali": "glaceon",
      "glastrier": "glastrier",
      "glimmet": "glimmet",
      "glimmora": "glimmora",
      "gliscor": "gliscor",
      "gobou": "mudkip",
      "goinfrex": "wooloo",
      "golisopod": "golisopod",
      "gorebyss": "gorebyss",
      "gorythmic": "rillaboom",
      "gossifleur": "gossifleur",
      "gouging fire": "gouging fire",
      "goupelin": "delphox",
      "goupix": "vulpix",
      "gourmelet": "greedent",
      "grafaiai": "grafaiai",
      "grainipiot": "seedot",
      "granbull": "granbull",
      "granivol": "hoppip",
      "grapploct": "grapploct",
      "gratistoc": "fomantis",
      "gravalanch": "graveler",
      "great tusk": "great tusk",
      "greavard": "greavard",
      "grenousse": "froakie",
      "grillepattes": "rolycoly",
      "grimmsnarl": "grimmsnarl",
      "grodoudou": "wigglytuff",
      "grolem": "golem",
      "groret": "grumpig",
      "grotadmorv": "muk",
      "grotichon": "pignite",
      "groudon": "groudon",
      "grubbin": "grubbin",
      "gruikui": "tepig",
      "gulpin": "gulpin",
      "gélenkong": "golurk",
      "gélénite": "golett",
      "géolithe": "roggenrola",
      "géorocher": "boldore",
      "hariyama": "hariyama",
      "hatenna": "hatenna",
      "hatterene": "hatterene",
      "hattrem": "hattrem",
      "heatran": "heatran",
      "heliatronc": "sunflora",
      "helionceau": "clauncher",
      "herbizarre": "ivysaur",
      "hericendre": "cyndaquil",
      "hippodocus": "hippowdon",
      "hippopotas": "hippopotas",
      "ho-oh": "ho-oh",
      "hoopa": "hoopa",
      "hoothoot": "hoothoot",
      "houba": "sunkern",
      "houndstone": "houndstone",
      "huntail": "huntail",
      "hydragon": "hydreigon",
      "hypno": "hypno",
      "hypocean": "seadra",
      "hypocéan": "seadra",
      "hypotrempe": "horsea",
      "héliatronc": "sunflora",
      "héliokong": "hakamo-o",
      "hélionceau": "clauncher",
      "héricendre": "cyndaquil",
      "impidimp": "impidimp",
      "indeedee": "indeedee",
      "indécis": "toucannon",
      "infernape": "infernape",
      "inkay": "inkay",
      "insecateur": "scyther",
      "ippi": "ledyba",
      "iron boulder": "iron boulder",
      "iron bundle": "iron bundle",
      "iron crown": "iron crown",
      "iron hands": "iron hands",
      "iron jugulis": "iron jugulis",
      "iron leaves": "iron leaves",
      "iron moth": "iron moth",
      "iron thorns": "iron thorns",
      "iron treads": "iron treads",
      "iron valiant": "iron valiant",
      "jangmo-o": "jangmo-o",
      "jirachi": "jirachi",
      "joltik": "joltik",
      "judokrak": "sawk",
      "jungko": "sceptile",
      "kabuto": "kabuto",
      "kabutops": "kabutops",
      "kadabra": "kadabra",
      "kaiminus": "totodile",
      "kangourex": "kangaskhan",
      "kaorine": "claydol",
      "karrablast": "karrablast",
      "kecleon": "kecleon",
      "keldeo": "keldeo",
      "keunotor": "shinx",
      "kicklee": "hitmonlee",
      "kilowattrel": "kilowattrel",
      "kingambit": "kingambit",
      "kingdra": "kingdra",
      "kirambolt": "eelektross",
      "kiramerou": "eelektrik",
      "kiramuné": "tynamo",
      "klang": "klang",
      "klawf": "klawf",
      "kleavor": "kleavor",
      "klefki": "durant",
      "klink": "klink",
      "klinklang": "klinklang",
      "kokiyas": "shellder",
      "komala": "komala",
      "koraidon": "koraidon",
      "krabboss": "crabominable",
      "krabby": "krabby",
      "kranidos": "cranidos",
      "kubfu": "kubfu",
      "kyogre": "kyogre",
      "kyurem": "kyurem",
      "laclacon": "lairon",
      "laclaçon": "lairon",
      "laggron": "swampert",
      "lainergie": "flaaffy",
      "lamantine": "dewgong",
      "lameduos": "doublade",
      "lampignon": "lampent",
      "lanturn": "lanturn",
      "lapin enflammé": "cinderace",
      "lapyro": "raboot",
      "larbinette": "charjabug",
      "larméléon": "sobble",
      "larvesta": "larvesta",
      "latias": "latias",
      "latios": "latios",
      "lechonk": "lechonk",
      "leopardus": "liepard",
      "leuphorie": "miltank",
      "leviator": "gyarados",
      "lianaja": "servine",
      "libegon": "flygon",
      "libégon": "flygon",
      "limagma": "slugma",
      "lineon": "linoone",
      "linéon": "linoone",
      "lionflame": "luxio",
      "lippoutou": "jynx",
      "litleo": "litleo",
      "litwick": "litwick",
      "lokhlass": "lapras",
      "lokix": "lokix",
      "lombre": "lombre",
      "lotad": "lotad",
      "lougaroc": "lycanroc",
      "loupio": "chinchou",
      "lucanon": "vikavolt",
      "lucario": "lucario",
      "ludicolo": "ludicolo",
      "lugia": "lugia",
      "lugulabre": "chandelure",
      "lumineon": "lumineon",
      "luminéon": "lumineon",
      "lumivole": "illumise",
      "lunala": "lunala",
      "lunatone": "lunatone",
      "luvdisc": "luvdisc",
      "luxray": "luxray",
      "léhot": "furfrou",
      "léopardus": "liepard",
      "lépidonille": "spewpa",
      "léviator": "gyarados",
      "lézard": "yamper",
      "lézargus": "inteleon",
      "m.mime": "mr. mime",
      "mabosstiff": "mabosstiff",
      "machoc": "machop",
      "machopeur": "machoke",
      "mackogneur": "machamp",
      "macronium": "bayleef",
      "magby": "magby",
      "magcargot": "magcargo",
      "magearna": "magearna",
      "magicarpe": "magikarp",
      "magmar": "magmar",
      "magmortar": "magmortar",
      "magneti": "magnemite",
      "magneton": "magneton",
      "magnezone": "magnezone",
      "magnézone": "magnezone",
      "majaspic": "serperior",
      "makuhita": "makuhita",
      "malamar": "malamar",
      "malosse": "mawile",
      "mammochon": "mamoswine",
      "manaphy": "manaphy",
      "mandibuzz": "mandibuzz",
      "manectric": "manectric",
      "mantyke": "mantyke",
      "maracachi": "sewaddle",
      "maractus": "maractus",
      "maraiste": "quagsire",
      "maraïste": "quagsire",
      "marill": "marill",
      "marisson": "chespin",
      "marshadow": "marshadow",
      "marshtomp": "marshtomp",
      "maschiff": "maschiff",
      "massko": "walrein",
      "matrefeu": "torracat",
      "maushold": "maushold",
      "mediator": "medicham",
      "meditite": "meditite",
      "meganium": "meganium",
      "melo": "igglybuff",
      "melodelfe": "clefable",
      "meloetta": "meloetta",
      "melofee": "clefairy",
      "melokrik": "kricketune",
      "mentali": "umbreon",
      "meowscarada": "meowscarada",
      "mesprit": "mesprit",
      "metagross": "metagross",
      "metamorph": "ditto",
      "metang": "metang",
      "mew": "mew",
      "mewtwo": "mewtwo",
      "miaouss": "meowth",
      "milcery": "milcery",
      "milobellus": "milotic",
      "mime jr": "mime jr.",
      "mime jr.": "mime jr.",
      "mimiqui": "mimikyu",
      "mimitoss": "venonat",
      "minidraco": "dratini",
      "minior": "minior",
      "minotaupe": "mienshao",
      "minotaupes": "mienfoo",
      "miradar": "watchog",
      "miraidon": "miraidon",
      "miroitile": "dewott",
      "mistigrix": "duskull",
      "momartik": "froslass",
      "monaflemmit": "slaking",
      "monaflèmit": "slaking",
      "monsieur mime": "mr. mime",
      "mopalid": "buizel",
      "morelull": "morelull",
      "morgrem": "morgrem",
      "morpeko": "morpeko",
      "moufouine": "slakoth",
      "moumouton": "dubwool",
      "moustillon": "oshawott",
      "mr mime": "mr. mime",
      "mudsdale": "mudsdale",
      "munja": "shedinja",
      "munkidori": "munkidori",
      "munna": "munna",
      "munoket": "herdier",
      "musharna": "musharna",
      "mystherbe": "oddish",
      "médiator": "medicham",
      "méganium": "meganium",
      "mélancolux": "beheeyem",
      "mélo": "igglybuff",
      "mélodelfe": "clefable",
      "méloetta": "meloetta",
      "mélofée": "clefairy",
      "mélokrik": "kricketune",
      "méowstic": "meowstic",
      "métang": "beldum",
      "nacli": "nacli",
      "naclstack": "naclstack",
      "natu": "natu",
      "necrozma": "necrozma",
      "negapi": "kricketot",
      "nidoking": "nidoking",
      "nidoqueen": "nidoqueen",
      "nidoran♀": "nidoran-f",
      "nidoran♂": "nidoran-m",
      "nidorina": "nidorina",
      "nidorino": "nidorino",
      "nihilego": "nihilego",
      "ninjask": "ninjask",
      "ninpict": "nincada",
      "nirondelle": "taillow",
      "noadkoko": "exeggutor",
      "noctale": "noctowl",
      "noctali": "espeon",
      "noeunoeuf": "exeggcute",
      "nosepass": "nosepass",
      "nosferalto": "golbat",
      "nosferapti": "zubat",
      "nostenfer": "crobat",
      "nounourson": "yungoos",
      "nymble": "nymble",
      "négapi": "steenee",
      "octillery": "octillery",
      "oculama": "dusclops",
      "ogerpon": "ogerpon",
      "oinkologne": "oinkologne",
      "okidogi": "okidogi",
      "oléodori": "volbeat",
      "onix": "onix",
      "orangite": "oranguru",
      "oratoria": "primarina",
      "orbeetle": "orbeetle",
      "oricorio": "oricorio",
      "orthworm": "orthworm",
      "ortide": "gloom",
      "ossatueur": "marowak",
      "osselait": "cubone",
      "otaquin": "popplio",
      "otaria": "seel",
      "otarlette": "brionne",
      "ouistempo": "grookey",
      "ouisticram": "chimchar",
      "overqwil": "overqwil",
      "pachirisu": "pachirisu",
      "palafin": "palafin",
      "palarticho": "toxtricity",
      "palkia": "palkia",
      "palmaval": "quaquaval",
      "paluroi": "unfezant",
      "pandarbare": "pangoro",
      "pandespiègle": "pancham",
      "pansage": "pansage",
      "papilord": "mothim",
      "papilusion": "butterfree",
      "papinox": "wormadam",
      "paras": "paras",
      "parasect": "parasect",
      "parpatin": "dustox",
      "passerouge": "passimian",
      "pawmi": "pawmi",
      "pawmo": "pawmo",
      "pawmot": "pawmot",
      "pawniard": "pawniard",
      "pecharunt": "pecharunt",
      "persian": "persian",
      "phanpy": "phanpy",
      "pharamp": "ampharos",
      "phione": "phione",
      "phogleur": "sealeo",
      "phyllali": "leafeon",
      "phylmeroide": "jellicent",
      "phylméroïde": "jellicent",
      "piafabec": "spearow",
      "picassaut": "pikipek",
      "pichu": "pichu",
      "pikachu": "pikachu",
      "piloswine": "piloswine",
      "pincurchin": "pincurchin",
      "pingoleon": "empoleon",
      "pingoléon": "empoleon",
      "pliplup": "skrelp",
      "poiscaille": "feebas",
      "poissirène": "goldeen",
      "poissoroy": "seaking",
      "polaire": "beartic",
      "poltchageist": "poltchageist",
      "polteageist": "polteageist",
      "pomdepik": "pineco",
      "ponyta": "ponyta",
      "porygon": "porygon",
      "porygon-z": "porygon-z",
      "porygon2": "porygon2",
      "posipi": "minun",
      "poussacha": "sprigatito",
      "poussifeu": "torchic",
      "prinplouf": "prinplup",
      "prismillon": "vivillon",
      "psykokwak": "psyduck",
      "ptera": "aerodactyl",
      "ptitard": "pidove",
      "ptéra": "aerodactyl",
      "pyroar": "pyroar",
      "pyroli": "flareon",
      "pyukumuku": "pyukumuku",
      "pétartille": "petilil",
      "pétilou": "pansage",
      "qwilfish": "qwilfish",
      "rabsca": "rabsca",
      "racaillou": "geodude",
      "rafflesia": "vileplume",
      "raging bolt": "raging bolt",
      "raichu": "raichu",
      "raikou": "raikou",
      "ramboum": "loudred",
      "ramoloss": "slowpoke",
      "rampardos": "rampardos",
      "rapasdepic": "fearow",
      "ratapic": "patrat",
      "rattata": "rattata",
      "rattatac": "raticate",
      "rayquaza": "rayquaza",
      "regice": "regice",
      "regidrago": "regidrago",
      "regieleki": "regieleki",
      "regigigas": "regigigas",
      "regirock": "regirock",
      "registeel": "registeel",
      "relicanth": "relicanth",
      "rellor": "rellor",
      "remorail": "remoraid",
      "reptincel": "charmeleon",
      "reshiram": "reshiram",
      "revavroom": "revavroom",
      "rexilys": "bouffalant",
      "rhinocorne": "rhyhorn",
      "rhinoferos": "rhydon",
      "rhinoféros": "rhydon",
      "riolu": "riolu",
      "roaring moon": "roaring moon",
      "rocabot": "rockruff",
      "roigada": "slowking",
      "rondoudou": "jigglypuff",
      "ronflex": "snorlax",
      "rookidee": "rookidee",
      "rosabyss": "binacle",
      "rosarden": "thievul",
      "roselia": "roselia",
      "roserade": "roserade",
      "rosélia": "roselia",
      "rotom": "rotom",
      "roucarnage": "pidgeot",
      "roucool": "pidgey",
      "roucoups": "pidgeotto",
      "roue de feu": "carkol",
      "roussil": "braixen",
      "rozbouton": "budew",
      "rémorail": "remoraid",
      "sabelette": "sandshrew",
      "sablaireau": "sandslash",
      "salameche": "charmander",
      "salamèche": "charmander",
      "salandit": "salandit",
      "sancoki": "shellos",
      "sandaconda": "sandaconda",
      "sandy shocks": "sandy shocks",
      "sapereau": "bunnelby",
      "scarabrute": "pinsir",
      "scarhino": "heracross",
      "scobolide": "scolipede",
      "scorplane": "skorupi",
      "scovillain": "scovillain",
      "scream tail": "scream tail",
      "sculptile": "castform",
      "seviper": "seviper",
      "sharpedo": "sharpedo",
      "shaymin": "shaymin",
      "shelgon": "shelgon",
      "sherval": "shuckle",
      "shiinotic": "shiinotic",
      "shroodle": "shroodle",
      "shuppet": "shuppet",
      "silcarène": "palossand",
      "silicolyte": "silicobra",
      "silvallié": "silvally",
      "sinistcha": "sinistcha",
      "sinistea": "sinistea",
      "sizzlipede": "sizzlipede",
      "skeledirge": "skeledirge",
      "skiploom": "skiploom",
      "skitty": "skitty",
      "skwovet": "skwovet",
      "slither wing": "slither wing",
      "slurpuff": "slurpuff",
      "smogo": "koffing",
      "smogogo": "weezing",
      "smoliv": "smoliv",
      "sneasler": "sneasler",
      "snom": "snom",
      "snorunt": "snorunt",
      "snubbull": "snubbull",
      "solaroc": "solrock",
      "solgaleo": "solgaleo",
      "somnambule": "drowzee",
      "soporifik": "weepinbell",
      "spectrier": "spectrier",
      "spectrum": "haunter",
      "spheal": "spheal",
      "spidops": "spidops",
      "spinda": "spinda",
      "spododo": "comfey",
      "spoink": "spoink",
      "squawkabilly": "squawkabilly",
      "stari": "staryu",
      "staross": "starmie",
      "steelix": "steelix",
      "stonjourner": "stonjourner",
      "stoutland": "stoutland",
      "stunfisk": "stunfisk",
      "sucroquin": "swirlix",
      "suicune": "suicune",
      "sulfura": "moltres",
      "swablu": "swablu",
      "swinub": "swinub",
      "swoobat": "swoobat",
      "séviper": "seviper",
      "tadbulb": "tadbulb",
      "tadmorv": "grimer",
      "tandemaus": "tandemaus",
      "tapu bulu": "tapu bulu",
      "tapu fini": "tapu fini",
      "tapu koko": "tapu koko",
      "tapu lele": "tapu lele",
      "tarinor": "baltoy",
      "tarountula": "tarountula",
      "tartard": "poliwrath",
      "tatsugiri": "tatsugiri",
      "taupiqueur": "diglett",
      "tauros": "tauros",
      "teddiursa": "teddiursa",
      "tenefix": "sableye",
      "tengalice": "shiftry",
      "tentacool": "tentacool",
      "tentacruel": "tentacruel",
      "terapagos": "terapagos",
      "terrakion": "terrakion",
      "tetarte": "poliwhirl",
      "thwackey": "thwackey",
      "timgeler": "timburr",
      "ting-lu": "ting-lu",
      "tinkatink": "tinkatink",
      "tinkaton": "tinkaton",
      "tinkatuff": "tinkatuff",
      "tiplouf": "piplup",
      "toedscool": "toedscool",
      "toedscruel": "toedscruel",
      "togedemaru": "togedemaru",
      "togekiss": "togekiss",
      "togepi": "togepi",
      "togetic": "togetic",
      "torkoal": "torkoal",
      "tortank": "blastoise",
      "torterra": "drednaw",
      "tortipouss": "turtwig",
      "toudoudou": "cleffa",
      "toxapex": "toxapex",
      "toxel": "toxel",
      "toxicroak": "toxicroak",
      "trac彼": "trapinch",
      "tranchodant": "fraxure",
      "tranchodeur": "haxorus",
      "trapince": "trapinch",
      "triopikeur": "dugtrio",
      "tritosor": "gastrodon",
      "trombebec": "trumbeak",
      "trombéclair": "honedge",
      "trop'k": "tropius",
      "tropius": "tropius",
      "tsareena": "tsareena",
      "tygnon": "hitmonchan",
      "typenull": "type: null",
      "typhlosion": "typhlosion",
      "tyranocif": "tyranitar",
      "tyrognon": "tyrogue",
      "ténéfix": "sableye",
      "têtarte": "poliwhirl",
      "têtodile": "tympole",
      "ursaluna": "ursaluna",
      "ursaring": "ursaring",
      "urshifu": "urshifu",
      "uxie": "uxie",
      "vagabond": "masquerain",
      "varoom": "varoom",
      "vaututrice": "heatmor",
      "veluza": "veluza",
      "venipède": "venipede",
      "vibraninf": "vibrava",
      "vigoroth": "glalie",
      "vipeliere": "snivy",
      "vipélierre": "snivy",
      "virizion": "virizion",
      "volcanion": "volcanion",
      "volcarona": "volcarona",
      "voltali": "jolteon",
      "voltorbe": "voltorb",
      "vomit": "purrloin",
      "voroguard": "braviary",
      "vostour": "foongus",
      "vullaby": "vullaby",
      "wailmer": "wailmer",
      "wailord": "wailord",
      "walking wake": "walking wake",
      "wattrel": "wattrel",
      "weavile": "weavile",
      "whimsicott": "whimsicott",
      "wiglett": "wiglett",
      "wimpod": "wimpod",
      "wo-chien": "wo-chien",
      "woobat": "woobat",
      "wugtrio": "wugtrio",
      "wyrdeer": "wyrdeer",
      "xatu": "xatu",
      "xerneas": "xerneas",
      "yanma": "yanma",
      "yanmega": "yanmega",
      "ymphect": "pupitar",
      "yveltal": "yveltal",
      "zacian": "zacian",
      "zamazenta": "zamazenta",
      "zangoose": "zangoose",
      "zarbi": "unown",
      "zarude": "zarude",
      "zekrom": "zekrom",
      "zeraora": "zeraora",
      "zigzaton": "zigzagoon",
      "zweilous": "zweilous",
      "zygarde": "zygarde",
      "zébibron": "zebstrika",
      "ægislash": "aegislash",
      "écayon": "shelmet",
      "écrevisso": "crawdaunt",
      "ékaïser": "kommo-o",
      "électabuzz": "electabuzz",
      "électhor": "zapdos",
      "électrode": "electrode",
      "élekable": "electivire",
      "élekid": "elekid",
      "élekross": "eelektross",
      "étouraptor": "staraptor",
      "étourchak": "staravia",
      "étourmi": "starly",
      "éveil": "dewpider",
      "évoli": "eevee",
  };

  function normalize(str) {
    // Retire les accents pour une recherche insensible aux accents
    return str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  // Dresseurs connus FR -> EN
  const TRAINER_FR_EN = {
    "n": "N", "cyrus": "Cyrus", "cynthia": "Cynthia",
    "giovanni": "Giovanni", "archer": "Archer", "ariana": "Ariana",
    "proton": "Proton", "petrel": "Petrel", "ghetsis": "Ghetsis",
    "lysandre": "Lysandre", "faba": "Faba", "lusamine": "Lusamine",
    "gladion": "Gladion", "hau": "Hau", "kukui": "Kukui",
    "plumeria": "Plumeria", "nanu": "Nanu", "rose": "Rose",
    "oleana": "Oleana", "bede": "Bede", "marnie": "Marnie",
    "piers": "Piers", "raihan": "Raihan", "leon": "Leon",
    "hop": "Hop", "mustard": "Mustard", "klara": "Klara",
    "avery": "Avery", "peonia": "Peonia",
  };

  function translateQuery(q) {
    const normalized = normalize(q);

    // Règle "Pokémon de Dresseur" → "Trainer's Pokémon"
    // Ex: "Zoroark de N" → "N's Zoroark ex"
    const deMatch = normalized.match(/^(.+?)\s+de\s+([a-z]+)$/);
    if (deMatch) {
      const pokemonNorm = deMatch[1].trim();
      const trainerNorm = deMatch[2].trim();
      const trainerEn = TRAINER_FR_EN[trainerNorm];
      if (trainerEn) {
        const pokemonEn = Object.entries(FR_TO_EN).find(([fr]) => normalize(fr) === pokemonNorm)?.[1] || pokemonNorm;
        return `${trainerEn}'s ${pokemonEn}`;
      }
    }

    // Cherche dans le dictionnaire principal (sans accents)
    for (const [fr, en] of Object.entries(FR_TO_EN)) {
      if (normalize(fr) === normalized) return en;
    }

    // Retourne la requête originale
    return q;
  }

  // ── Upload local ──────────────────────────────────────────
  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => creator.setCardImage(e.target.result);
    reader.readAsDataURL(file);
  }
  function onDrop(e) {
    e.preventDefault(); isDragging = false; handleFile(e.dataTransfer.files[0]);
  }
  function onFileInput(e) { handleFile(e.target.files[0]); }

  // ── Recherche API TCG ─────────────────────────────────────
  function doSearch() {
    if (searchQuery.length < 2) { searchResults = []; return; }
    isSearching = true; searchError = false;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const translated = translateQuery(searchQuery);
      // Pour les requêtes courtes (<= 3 chars) ou avec caractères spéciaux,
      // on évite les guillemets qui peuvent casser la query pokemontcg.io
      const q = translated.length <= 3
        ? `name:${translated}*`
        : `name:"*${translated}*"`;
      try {
        const result = await pokemon.card.where({
          q,
          select: "id,name,number,supertype,subtypes,rarity,images,types,set",
          orderBy: "-set.releaseDate",
          pageSize: 100,
        });
        searchResults = (result.data || []).map(c => ({ ...c, set: c.set?.id || c.set }));
      } catch(e) { searchError = true; }
      finally { isSearching = false; }
    }, 400);
  }

  function getRarityColor(rarity = "") {
    const r = rarity.toLowerCase();
    if (r.includes("rainbow"))  return "#e879f9";
    if (r.includes("secret"))   return "#fbbf24";
    if (r.includes("ultra"))    return "#f97316";
    if (r.includes("rare holo v") || r.includes("vmax") || r.includes("vstar")) return "#60a5fa";
    if (r.includes("amazing"))  return "#34d399";
    if (r.includes("holo"))     return "#a78bfa";
    if (r.includes("radiant"))  return "#f472b6";
    return "rgba(255,255,255,0.25)";
  }

  function selectApiCard(card) {
    creator.setCardDataWithEffect({
      img: card.images?.large || card.images?.small || "",
      name: card.name,
      types: card.types || ["colorless"],
      supertype: card.supertype?.toLowerCase() || "pokémon",
      subtypes: card.subtypes || ["Basic"],
      rarity: card.rarity || "Common",
      set: card.set || "swsh1",
      number: card.number || "001",
      id: card.id || "custom",
    }, guessEffect(card));
  }

  function guessEffect(card) {
    const r = (card.rarity || "").toLowerCase();
    const sub = (card.subtypes || []).join("").toLowerCase();
    if (r.includes("secret"))                      return "secret-rare";
    if (r.includes("rainbow"))                     return "rainbow-holo";
    if (r.includes("amazing"))                     return "amazing-rare";
    if (r.includes("radiant"))                     return "radiant-holo";
    if (r.includes("cosmos"))                      return "cosmos-holo";
    if (r.includes("vmax") || sub.includes("vmax")) return "v-max";
    if (r.includes("vstar"))                       return "v-star";
    if (r.includes("rare ultra") || r.includes("rare holo v")) return "v-full-art";
    if (sub.includes(" v") && !sub.includes("vmax")) return "v-regular";
    if (r.includes("rare holo"))                   return "regular-holo";
    return "basic";
  }

  $: searchQuery && doSearch();
</script>

<div class="import-panel">

  <CardHistory />

  <div class="tabs">
    <button class:active={activeTab === "upload"} on:click={() => activeTab = "upload"}>
      📁 Upload local
    </button>
    <button class:active={activeTab === "search"} on:click={() => activeTab = "search"}>
      🔍 Recherche TCG
    </button>
  </div>

  <!-- UPLOAD TAB -->
  {#if activeTab === "upload"}
    <div
      class="dropzone"
      class:dragging={isDragging}
      on:dragover|preventDefault={() => isDragging = true}
      on:dragleave={() => isDragging = false}
      on:drop={onDrop}
    >
      <div class="dropzone__inner">
        <span class="dropzone__icon">🃏</span>
        <p>Glisse une image ici</p>
        <p class="hint">ou</p>
        <label class="btn">
          Choisir un fichier
          <input type="file" accept="image/*" on:change={onFileInput} hidden />
        </label>
      </div>
    </div>
  {/if}

  <!-- SEARCH TAB -->
  {#if activeTab === "search"}
    <div class="search-tab">
      <div class="search-input-wrap">
        <span class="search-icon">🔍</span>
        <input
          type="search"
          bind:value={searchQuery}
          placeholder="Pikachu, Dracaufeu, Giratina..."
          class="search-input"
          autocomplete="off"
          spellcheck="false"
        />
        {#if isSearching}
          <span class="spinner"></span>
        {:else if searchQuery}
          <button class="clear-btn" on:click={() => { searchQuery = ""; searchResults = []; }}>✕</button>
        {/if}
      </div>

      {#if searchQuery.length >= 2 && !isSearching && searchResults.length > 0}
        <p class="results-count">{searchResults.length} résultat{searchResults.length > 1 ? "s" : ""}</p>
      {/if}

      {#if searchError}
        <p class="error">⚠️ Erreur de connexion</p>
      {/if}

      <div class="results-grid">
        {#each searchResults as card (card.id)}
          {@const rarityColor = getRarityColor(card.rarity)}
          <button
            class="result-card"
            class:selected={card.id === currentCardId}
            on:click={() => selectApiCard(card)}
            title="{card.name} — {card.rarity || ''}"
          >
            <div class="card-img-wrap">
              <img
                src={card.images?.large || card.images?.small}
                alt={card.name}
                loading="lazy"
              />
            </div>
            <div class="card-info">
              <span class="result-name">{card.name}</span>
              {#if card.rarity}
                <span class="result-rarity" style="color: {rarityColor}">
                  {card.rarity}
                </span>
              {/if}
            </div>
          </button>
        {/each}
      </div>

      {#if searchQuery.length >= 2 && !isSearching && !searchResults.length && !searchError}
        <div class="no-results">
          <span>🔎</span>
          <p>Aucun résultat pour « {searchQuery} »</p>
          <p class="no-results-hint">L'API est en anglais — essaie le nom anglais</p>
        </div>
      {/if}

      {#if searchQuery.length < 2 && !searchResults.length}
        <div class="search-placeholder">
          <span>✨</span>
          <p>Tape le nom d'une carte<br/>en français ou en anglais</p>
        </div>
      {/if}
    </div>
  {/if}

</div>

<style>
  .import-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    height: 100%;
  }

  /* ── Tabs ── */
  .tabs { display: flex; gap: 6px; flex-shrink: 0; }

  .tabs button {
    flex: 1; padding: 8px 10px;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.5);
    cursor: pointer; font-size: 13px;
    transition: all 0.2s ease;
  }
  .tabs button.active {
    background: rgba(255,255,255,0.12);
    color: white;
    border-color: rgba(255,255,255,0.25);
  }

  /* ── Dropzone ── */
  .dropzone {
    border: 2px dashed rgba(255,255,255,0.2);
    border-radius: 12px;
    padding: 30px 20px;
    text-align: center;
    transition: all 0.2s ease;
    cursor: pointer;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .dropzone.dragging { border-color: var(--primary, #4dd9f0); background: rgba(77,217,240,0.07); }
  .dropzone__inner { display: flex; flex-direction: column; align-items: center; gap: 8px; color: rgba(255,255,255,0.6); }
  .dropzone__icon { font-size: 40px; }
  .dropzone__inner p { margin: 0; font-size: 14px; }
  .hint { opacity: 0.4; font-size: 12px !important; }
  .btn {
    display: inline-block; padding: 8px 18px;
    background: var(--primary, #4dd9f0);
    color: hsl(192, 87%, 15%);
    border-radius: 6px; cursor: pointer;
    font-weight: bold; font-size: 13px;
    transition: opacity 0.2s;
  }
  .btn:hover { opacity: 0.85; }

  /* ── Search tab ── */
  .search-tab {
    display: flex; flex-direction: column; gap: 8px;
    flex: 1; overflow: hidden; min-height: 0;
    height: 0; /* force flex child to respect parent height */
  }

  .search-input-wrap {
    position: relative; flex-shrink: 0;
  }
  .search-icon {
    position: absolute; left: 10px; top: 50%;
    transform: translateY(-50%); font-size: 14px;
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    padding: 10px 36px 10px 34px;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 10px;
    background: rgba(255,255,255,0.07);
    color: white; font-size: 14px; outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, background 0.2s;
  }
  .search-input:focus {
    border-color: var(--primary, #4dd9f0);
    background: rgba(255,255,255,0.09);
  }
  .search-input::placeholder { color: rgba(255,255,255,0.3); }

  .spinner {
    position: absolute; right: 10px; top: 50%;
    transform: translateY(-50%);
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.1);
    border-top-color: var(--primary, #4dd9f0);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }

  .clear-btn {
    position: absolute; right: 10px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none;
    color: rgba(255,255,255,0.3);
    cursor: pointer; font-size: 12px; padding: 4px;
    transition: color 0.2s;
  }
  .clear-btn:hover { color: rgba(255,255,255,0.7); }

  .results-count {
    font-size: 11px; color: rgba(255,255,255,0.3);
    margin: 0; flex-shrink: 0;
    padding: 0 2px;
  }

  /* ── Results grid ── */
  .results-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    overflow-y: auto;
    overflow-x: hidden;   /* jamais de scroll horizontal */
    flex: 1;
    min-height: 0;
    width: 100%;
    box-sizing: border-box;
    padding-right: 2px;
    align-content: start;
  }

  .result-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    padding: 0;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    transition: all 0.18s ease;
    text-align: center;
    min-width: 0;
    overflow: visible;   /* ne jamais clipper le contenu */
    width: 100%;
    box-sizing: border-box;
  }
  .result-card:hover {
    background: rgba(255,255,255,0.1);
    border-color: var(--primary, #4dd9f0);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
  }
  .result-card.selected {
    border-color: var(--primary, #4dd9f0);
    background: rgba(77,217,240,0.1);
    box-shadow: 0 0 12px rgba(77,217,240,0.25);
  }
  .result-card.selected {
    border-color: var(--primary, #4dd9f0);
    background: rgba(77,217,240,0.1);
    box-shadow: 0 0 12px rgba(77,217,240,0.25);
  }

  .card-img-wrap {
    width: 100%;
    display: block;
    background: transparent;
    line-height: 0;
    border-radius: 10px 10px 0 0;
    overflow: hidden;  /* clip l'image seulement, pas le texte */
  }
  .card-img-wrap img {
    width: 100%;
    height: auto;
    display: block;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    padding: 5px 5px 6px;
    box-sizing: border-box;
    background: rgba(20,21,28,0.92);
    border-radius: 0 0 10px 10px;
    border-top: 1px solid rgba(255,255,255,0.06);
    /* toujours visible, jamais clippé */
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .result-name {
    font-size: 11px;
    color: white;
    font-weight: 700;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }
  .result-rarity {
    font-size: 9px;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
    opacity: 1;
  }

  /* ── States ── */
  .error {
    color: hsl(0, 80%, 70%); font-size: 13px;
    text-align: center; margin: 0; flex-shrink: 0;
  }

  .no-results, .search-placeholder {
    display: flex; flex-direction: column;
    align-items: center; gap: 8px;
    color: rgba(255,255,255,0.25);
    text-align: center; padding: 24px 10px;
    flex: 1; justify-content: center;
  }
  .no-results span, .search-placeholder span { font-size: 28px; }
  .no-results p, .search-placeholder p { margin: 0; font-size: 13px; line-height: 1.5; }
  .no-results-hint { font-size: 11px !important; opacity: 0.6; }
</style>
