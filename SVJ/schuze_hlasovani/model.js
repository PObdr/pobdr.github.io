class Schuze {
    constructor() {
        this.id = new Date().toISOString();
        this.vlastnici = [];
        this.dochazka = {};
        this.hlasovani = [];
        this.celkovaVaha = 0;
    }
}

class Hlasovani {
    constructor(otazka, pritomniVlastnici) {
        this.casVytvoreni = new Date(); // Správné vytvoření data
        // Ověření platnosti data
        if (isNaN(this.casVytvoreni.getTime())) {
            throw new Error("Neplatný čas vytvoření hlasování");
        }
        
        this.otazka = otazka;
        this.pritomniVlastnici = pritomniVlastnici.map(v => ({
            'Číslo jednotky': v['Číslo jednotky'],
            'Vlastník': v['Vlastník'],
            'Podíl': v['Podíl'],
            hlas: 'pro'
        }));
        
        this.celkovaVahaHlasovani = this.pritomniVlastnici.reduce((sum, v) => 
            sum + this.zlomekNaCislo(v['Podíl']), 0);
        
        this.vysledek = this.spocitatVysledky();
    }

    spocitatVysledky() {
        const vysledek = { pro: 0, proti: 0, zdrzelSe: 0 };
        
        this.pritomniVlastnici.forEach(v => {
            const podil = this.zlomekNaCislo(v['Podíl']);
            switch(v.hlas) {
                case 'pro': vysledek.pro += podil; break;
                case 'proti': vysledek.proti += podil; break;
                default: vysledek.zdrzelSe += podil;
            }
        });
        
        return {
            pro: (vysledek.pro / this.celkovaVahaHlasovani * 100) || 0,
            proti: (vysledek.proti / this.celkovaVahaHlasovani * 100) || 0,
            zdrzelSe: (vysledek.zdrzelSe / this.celkovaVahaHlasovani * 100) || 0
        };
    }

    zlomekNaCislo(zlomek) {
        const [citatel, jmenovatel] = zlomek.split('/').map(Number);
        return citatel / jmenovatel;
    }
}


class Model {
    constructor() {
        this.aktualniSchuze = new Schuze();
        this.minuleSchuze = [];
    }

    nacistVlastniky(data) {
        try {
            this.aktualniSchuze.vlastnici = data
                .filter(v => v['Číslo jednotky'] && v['Vlastník'] && v['Podíl'])
                .map(v => ({
                    'Číslo jednotky': v['Číslo jednotky'].toString().trim(),
                    'Vlastník': v['Vlastník'].trim(),
                    'Podíl': v['Podíl'].trim()
                }))
                .filter(v => this.zlomekNaCislo(v['Podíl']) > 0);
            
            this.aktualniSchuze.celkovaVaha = this.aktualniSchuze.vlastnici
                .reduce((sum, v) => sum + this.zlomekNaCislo(v['Podíl']), 0);
        } catch (error) {
            throw new Error('Neplatný formát dat vlastníků');
        }
    }

    zmenitPritomnost(index, pritomen) {
        const vlastnik = this.aktualniSchuze.vlastnici[index];
        const cisloJednotky = vlastnik['Číslo jednotky'];
        
        if (!this.aktualniSchuze.dochazka[cisloJednotky]) {
            this.aktualniSchuze.dochazka[cisloJednotky] = {
                zaznamy: [],
                vlastnik: vlastnik['Vlastník'],
                podil: vlastnik['Podíl']
            };
        }
        
        const zaznamy = this.aktualniSchuze.dochazka[cisloJednotky].zaznamy;
        const posledniTyp = zaznamy[zaznamy.length - 1]?.typ;
        
        if (pritomen && posledniTyp !== 'prichod') {
            zaznamy.push({ cas: new Date(), typ: 'prichod' });
        } else if (!pritomen && posledniTyp === 'prichod') {
            zaznamy.push({ cas: new Date(), typ: 'odchod' });
        }
    }

    vytvoritHlasovani(otazka) {
        const pritomni = this.getAktualnePritomni();
        return new Hlasovani(otazka, pritomni);
    }

    upravitHlasovani(casVytvoreni, novaOtazka, novyHlasy) {
    const hlasovani = this.aktualniSchuze.hlasovani.find(h => 
        h.casVytvoreni.toISOString() === new Date(casVytvoreni).toISOString()
    );

    if (hlasovani) {
        hlasovani.otazka = novaOtazka;
        hlasovani.pritomniVlastnici.forEach(v => {
            v.hlas = novyHlasy[v['Číslo jednotky']] || 'pro';
        });
        hlasovani.vysledek = hlasovani.spocitatVysledky();
    }
}


    smazatHlasovani(id) {
        this.aktualniSchuze.hlasovani = this.aktualniSchuze.hlasovani.filter(h => h.id !== id);
    }

    getAktualnePritomni() {
        return Object.entries(this.aktualniSchuze.dochazka)
            .filter(([_, d]) => d.zaznamy.slice(-1)[0]?.typ === 'prichod')
            .map(([cislo, _]) => this.aktualniSchuze.vlastnici.find(v => 
                v['Číslo jednotky'] === cislo
            ))
            .filter(v => v !== undefined);
    }

    spocitatPodilPritomnych() {
        const soucet = Object.values(this.aktualniSchuze.dochazka)
            .filter(d => d.zaznamy?.slice(-1)[0]?.typ === 'prichod')
            .reduce((sum, d) => sum + this.zlomekNaCislo(d.podil), 0);
            
        return {
            hodnota: soucet,
            procenta: this.aktualniSchuze.celkovaVaha > 0 
                ? Number((soucet / this.aktualniSchuze.celkovaVaha * 100).toFixed(2))
                : 0
        };
    }

    zlomekNaCislo(zlomek) {
        if(!zlomek || typeof zlomek !== 'string') return 0;
        const casti = zlomek.split('/');
        if(casti.length !== 2) return 0;
        const citatel = parseFloat(casti[0]);
        const jmenovatel = parseFloat(casti[1]);
        return jmenovatel !== 0 ? citatel/jmenovatel : 0;
    }

    ulozSchuzi() {
        return new Blob([JSON.stringify(this.aktualniSchuze)], {type: 'application/json'});
    }

    nacistSchuzi(data) {
        const rawData = JSON.parse(data);
        const novaSchuze = new Schuze();
        
        // Kopírování základních vlastností
        Object.assign(novaSchuze, rawData);

        // Konverze datumů pro docházku
        novaSchuze.dochazka = Object.entries(rawData.dochazka).reduce((acc, [key, value]) => {
            acc[key] = {
                ...value,
                zaznamy: value.zaznamy.map(z => ({
                    ...z,
                    cas: new Date(z.cas)
                }))
            };
            return acc;
        }, {});

        // Rekonstrukce hlasování
        novaSchuze.hlasovani = rawData.hlasovani.map(h => {
            const casVytvoreni = new Date(h.casVytvoreni);
            if (isNaN(casVytvoreni.getTime())) {
                throw new Error(`Neplatný formát data v uložených datech: ${h.casVytvoreni}`);
            }

            const hlasovani = new Hlasovani(h.otazka, h.pritomniVlastnici);
            hlasovani.casVytvoreni = casVytvoreni;
            hlasovani.pritomniVlastnici = h.pritomniVlastnici;
            hlasovani.vysledek = h.vysledek;
            hlasovani.celkovaVahaHlasovani = h.celkovaVahaHlasovani;

            return hlasovani;
        });

        // Kontrola a konverze dalších datumů, pokud existují
        if (novaSchuze.datumZahajeni) {
            novaSchuze.datumZahajeni = new Date(novaSchuze.datumZahajeni);
        }
        if (novaSchuze.datumUkonceni) {
            novaSchuze.datumUkonceni = new Date(novaSchuze.datumUkonceni);
        }

        // Výpočet celkové váhy, pokud není uložena
        if (typeof novaSchuze.celkovaVaha !== 'number') {
            novaSchuze.celkovaVaha = novaSchuze.vlastnici.reduce((sum, v) => 
                sum + this.zlomekNaCislo(v['Podíl']), 0);
        }

        this.aktualniSchuze = novaSchuze;
        this.minuleSchuze.push(novaSchuze);

        console.log('Načtená schůze:', novaSchuze);
    }

    // Helper metoda pro konverzi zlomku na číslo
    zlomekNaCislo(zlomek) {
        const [citatel, jmenovatel] = zlomek.split('/').map(Number);
        return jmenovatel !== 0 ? citatel / jmenovatel : 0;
    }
    generujCasovouOsy() {
    const udalosti = [];
    
    // Zaznamenáme všechny časové okamžiky změn zaokrouhlené na konec minuty
    Object.values(this.aktualniSchuze.dochazka).forEach(data => {
        data.zaznamy.forEach(zaznam => {
            const cas = new Date(zaznam.cas);
            cas.setSeconds(59, 999); // Poslední možný okamžik v minutě
            udalosti.push({
                cas: cas.getTime(),
                jednotka: data.jednotka,
                typ: zaznam.typ
            });
        });
    });

    // Získání unikátních časových značek
    const casy = [...new Set(udalosti.map(u => u.cas))].sort((a, b) => a - b);

    return casy.map(cas => {
        const datum = new Date(cas);
        let pocet = 0;
        let podil = 0;

        Object.entries(this.aktualniSchuze.dochazka).forEach(([jednotka, data]) => {
            const posledniZaznam = data.zaznamy
                .filter(z => {
                    const zCas = new Date(z.cas);
                    zCas.setSeconds(59, 999);
                    return zCas.getTime() <= cas;
                })
                .slice(-1)[0];

            if (posledniZaznam?.typ === 'prichod') {
                pocet++;
                podil += this.zlomekNaCislo(data.podil);
            }
        });

        return {
            cas: datum,
            pocetPritomnych: pocet,
            podilPritomnych: Number((podil / this.aktualniSchuze.celkovaVaha * 100).toFixed(2))
        };
    });
}

    getPritomniVCase(cas) {
    const konecMinuty = new Date(cas);
    konecMinuty.setSeconds(59); // Poslední sekunda minuty
    
    return Object.entries(this.aktualniSchuze.dochazka)
        .filter(([_, data]) => {
            const posledniZaznam = data.zaznamy
                .filter(z => new Date(z.cas) <= konecMinuty)
                .slice(-1)[0];
            return posledniZaznam?.typ === 'prichod';
        })
        .map(([cisloJednotky, data]) => {
            const vlastnik = this.aktualniSchuze.vlastnici.find(v => v['Číslo jednotky'] === cisloJednotky);
            return {
                jednotka: cisloJednotky,
                vlastnik: vlastnik['Vlastník'],
                podil: vlastnik['Podíl']
            };
        });
}

}

