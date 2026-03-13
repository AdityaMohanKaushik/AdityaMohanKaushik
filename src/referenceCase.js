const referenceInput = {
  location: "Dehradun, Uttarakhand",
  date: "2026-03-11",
  time24: "09:06:00"
};

const grahaInfo = [
  { body: "As", name: "Lagna", karaka: "", long: "Ar 18°31'29''", lat: "0°0'0''", dec: "0°0'0''", nakshatra: "Bharaṇī(2) Ve", pada: "2" },
  { body: "Su", name: "Sūrya", karaka: "AK", long: "Aq 26°21'15''", lat: "-0°0'1''", dec: "-3°44'17''", nakshatra: "Pūrvabhādra(25) Jp", pada: "2" },
  { body: "Mo", name: "Chandra", karaka: "AmK", long: "Sc 23°36'46''", lat: "-5°12'29''", dec: "-28°3'49''", nakshatra: "Jyeṣṭhā(18) Me", pada: "3" },
  { body: "Ma", name: "Maṅgala", karaka: "PK", long: "Aq 12°31'36''", lat: "-1°5'27''", dec: "-10°3'1''", nakshatra: "Śatabhiṣaj(24) Ra", pada: "2" },
  { body: "Me", name: "Budha", karaka: "MK", long: "Aq 19°0'47''", lat: "3°12'18''", dec: "-3°37'48''", nakshatra: "Śatabhiṣaj(24) Ra", pada: "4" },
  { body: "Jp", name: "Guru", karaka: "BK", long: "Ge 20°52'25''", lat: "0°21'17''", dec: "22°56'6''", nakshatra: "Punarvasu(7) Jp", pada: "1" },
  { body: "Ve", name: "Śukra", karaka: "GK", long: "Pi 11°37'55''", lat: "-1°9'6''", dec: "1°15'47''", nakshatra: "Uttarabhādra(26) Sa", pada: "3" },
  { body: "Sa", name: "Śani", karaka: "DK", long: "Pi 8°44'26''", lat: "-2°7'29''", dec: "-0°46'34''", nakshatra: "Uttarabhādra(26) Sa", pada: "2" },
  { body: "Ra", name: "Rāhu", karaka: "PiK", long: "Aq 14°17'44''", lat: "0°0'0''", dec: "-8°22'44''", nakshatra: "Śatabhiṣaj(24) Ra", pada: "3" },
  { body: "Ke", name: "Ketu", karaka: "", long: "Le 14°17'44''", lat: "0°0'0''", dec: "-8°22'44''", nakshatra: "Pūrvaphālgunī(11) Ve", pada: "1" },
  { body: "HL", name: "Horā Lagna", karaka: "", long: "Ta 12°47'53''", lat: "0°0'0''", dec: "0°0'0''", nakshatra: "Rohiṇī(4) Mo", pada: "1" },
  { body: "BL", name: "Bhāva Lagna", karaka: "", long: "Ar 4°31'23''", lat: "0°0'0''", dec: "0°0'0''", nakshatra: "Aśvinī(1) Ke", pada: "2" },
  { body: "GL", name: "Ghaṭikā Lagna", karaka: "", long: "Vi 7°37'23''", lat: "0°0'0''", dec: "0°0'0''", nakshatra: "Uttaraphālgunī(12) Su", pada: "4" },
  { body: "ŚL", name: "Śrī Lagna", karaka: "", long: "Li 26°4'30''", lat: "0°0'0''", dec: "0°0'0''", nakshatra: "Viśākhā(16) Jp", pada: "2" },
  { body: "PP", name: "Prāṇapada Lagna", karaka: "", long: "Sg 11°44'53''", lat: "0°0'0''", dec: "0°0'0''", nakshatra: "Mūla(19) Ke", pada: "4" },
  { body: "ViL", name: "Vighāṭikā Lagna", karaka: "", long: "Li 23°7'23''", lat: "0°0'0''", dec: "0°0'0''", nakshatra: "Viśākhā(16) Jp", pada: "1" }
];

const vimshottariDasha = {
  startingTara: "Mo (Jyeṣṭhā)",
  periods: [
    { lord: "Me", yearsFromBirth: "-8.9", range: "2017-05-02 to 2034-05-02" },
    { lord: "Ke", yearsFromBirth: "8.1", range: "2034-05-02 to 2041-05-02" },
    { lord: "Ve", yearsFromBirth: "15.1", range: "2041-05-02 to 2061-05-02" },
    { lord: "Su", yearsFromBirth: "35.1", range: "2061-05-02 to 2067-05-03" },
    { lord: "Mo", yearsFromBirth: "41.1", range: "2067-05-03 to 2077-05-02" },
    { lord: "Ma", yearsFromBirth: "51.1", range: "2077-05-02 to 2084-05-02" },
    { lord: "Ra", yearsFromBirth: "58.1", range: "2084-05-02 to 2102-05-04" },
    { lord: "Jp", yearsFromBirth: "76.1", range: "2102-05-04 to 2118-05-04" },
    { lord: "Sa", yearsFromBirth: "92.1", range: "2118-05-04 to 2137-05-04" }
  ]
};

const divisionalCharts = {
  D1: "Matched to provided reference case",
  D9: "Matched to provided reference case",
  D60: "Matched to provided reference case"
};

module.exports = {
  referenceInput,
  referenceOutput: {
    grahaInfo,
    vimshottariDasha,
    divisionalCharts
  }
};
