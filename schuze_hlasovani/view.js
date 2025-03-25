class View {
    constructor() {
        this.bindUIElements();
    }

    bindUIElements() {
        this.vlastniciTbody = document.querySelector('#vlastniciTabulka tbody');
        this.hlasovaniTbody = document.querySelector('#hlasovaniTabulka tbody');
        this.prehledHlasovani = document.querySelector('#prehledHlasovani tbody');
        this.podilPritomnych = document.getElementById('podilPritomnych');
        this.casovaOsaBody = document.getElementById('casovaOsaBody');
    }

    zobrazVlastniky(vlastnici) {
        this.vlastniciTbody.innerHTML = vlastnici.map((v, i) => `
            <tr>
                <td>${v['Číslo jednotky']}</td>
                <td>${v['Vlastník']}</td>
                <td>${v['Podíl']}</td>
                <td>
                    <div class="form-check form-switch switch-lg">
                        <input class="form-check-input" type="checkbox" 
                               id="pritomnost${i}" 
                               ${this.jePritomen(v['Číslo jednotky']) ? 'checked' : ''}
                               onchange="controller.zmenitPritomnost(${i}, this.checked)">
                    </div>
                </td>
            </tr>
        `).join('');
    }

    jePritomen(cisloJednotky) {
        const zaznamy = controller.model.aktualniSchuze.dochazka[cisloJednotky]?.zaznamy;
        return zaznamy && zaznamy.length > 0 && zaznamy.slice(-1)[0].typ === 'prichod';
    }

    zobrazHlasovaciFormular(hlasovani) {
    if (!hlasovani) {
        console.error('Pokus o zobrazení neexistujícího hlasování');
        return;
    }
    document.getElementById('hlasovaniOtazka').value = hlasovani.otazka;                                   
        document.getElementById('hlasovaniOtazka').innerHTML = `
            ${hlasovani.otazka}
            <span class="badge bg-primary ms-2">
                Celkový podíl přítomných: ${hlasovani.celkovaVahaHlasovani.toFixed(4)}
            </span>
        `;
        this.hlasovaniTbody.innerHTML = hlasovani.pritomniVlastnici.map(v => `
            <tr>
                <td>${v['Číslo jednotky']}</td>
                <td>${v['Vlastník']}</td>
                <td>${v['Podíl']}</td>
                <td>
                    <div class="btn-group" role="group">
                        <input type="radio" class="btn-check" name="hlas${v['Číslo jednotky']}" 
                               id="pro_${hlasovani.id}_${v['Číslo jednotky']}" 
                               value="pro" ${v.hlas === 'pro' ? 'checked' : ''}>
                        <label class="btn btn-outline-success" for="pro_${hlasovani.id}_${v['Číslo jednotky']}">Pro</label>
                        
                        <input type="radio" class="btn-check" name="hlas${v['Číslo jednotky']}" 
                               id="proti_${hlasovani.id}_${v['Číslo jednotky']}" 
                               value="proti" ${v.hlas === 'proti' ? 'checked' : ''}>
                        <label class="btn btn-outline-danger" for="proti_${hlasovani.id}_${v['Číslo jednotky']}">Proti</label>
                        
                        <input type="radio" class="btn-check" name="hlas${v['Číslo jednotky']}" 
                               id="zdrzelSe_${hlasovani.id}_${v['Číslo jednotky']}" 
                               value="zdrzelSe" ${v.hlas === 'zdrzelSe' ? 'checked' : ''}>
                        <label class="btn btn-outline-secondary" for="zdrzelSe_${hlasovani.id}_${v['Číslo jednotky']}">Zdržel se</label>
                    </div>
                </td>
            </tr>
        `).join('');
        document.getElementById('hlasovaniForm').classList.remove('d-none');
    }

   aktualizujDashboard(podilPritomnych, hlasovani) {
    const procenta = podilPritomnych.procenta;
    const hodnota = podilPritomnych.hodnota.toFixed(4);
    this.podilPritomnych.textContent = `${procenta}% (${hodnota})`;

    // Helper funkce
    const GCD = (a, b) => b ? GCD(b, a % b) : Math.abs(a);
    const LCM = (a, b) => (a * b) / GCD(a, b);
    
    const sumFractions = (fractions) => {
        if (fractions.length === 0) return { citatel: 0, jmenovatel: 1 };
        
        let currentSum = fractions[0];
        for (let i = 1; i < fractions.length; i++) {
            const next = fractions[i];
            const lcm = LCM(currentSum.jmenovatel, next.jmenovatel);
            const adjustedCurrent = currentSum.citatel * (lcm / currentSum.jmenovatel);
            const adjustedNext = next.citatel * (lcm / next.jmenovatel);
            
            currentSum = {
                citatel: adjustedCurrent + adjustedNext,
                jmenovatel: lcm
            };
            
            // Zjednodušení po každém kroku
            const gcd = GCD(currentSum.citatel, currentSum.jmenovatel);
            currentSum.citatel /= gcd;
            currentSum.jmenovatel /= gcd;
        }
        return currentSum;
    };

    this.prehledHlasovani.innerHTML = hlasovani.map(h => {
        // Inicializace skupin pro každý typ hlasu
        const fractions = {
            pro: [],
            proti: [],
            zdrzelSe: []
        };

        // Naplnění daty
        h.pritomniVlastnici.forEach(v => {
            const [citatel, jmenovatel] = v.Podíl.split('/').map(Number);
            fractions[v.hlas].push({ citatel, jmenovatel });
        });

        // Výpočet součtů pro každou skupinu
        const proSum = sumFractions(fractions.pro);
        const protiSum = sumFractions(fractions.proti);
        const zdrzelSeSum = sumFractions(fractions.zdrzelSe);

        return `
    <tr>
        <td>${h.casVytvoreni.toLocaleString('cs-CZ', { dateStyle: 'short', timeStyle: 'short' })}</td>
        <td>${h.otazka}</td>
        <td>
                <div class="progress">
                    <div class="progress-bar bg-success" style="width: ${h.vysledek.pro}%" title="Pro: ${h.vysledek.pro.toFixed(2)}%"></div>
                    <div class="progress-bar bg-danger" style="width: ${h.vysledek.proti}%" title="Proti: ${h.vysledek.proti.toFixed(2)}%"></div>
                    <div class="progress-bar bg-secondary" style="width: ${h.vysledek.zdrzelSe}%" title="Zdržel se: ${h.vysledek.zdrzelSe.toFixed(2)}%"></div>
                </div>
                <small>
                    Pro: ${h.vysledek.pro.toFixed(2)}%, 
                    Proti: ${h.vysledek.proti.toFixed(2)}%, 
                    Zdržel se: ${h.vysledek.zdrzelSe.toFixed(2)}%
                </small>
                <br>
                <small class="text-muted">
                    Pro: ${proSum.citatel}/${proSum.jmenovatel}, 
                    Proti: ${protiSum.citatel}/${protiSum.jmenovatel}, 
                    Zdržel se: ${zdrzelSeSum.citatel}/${zdrzelSeSum.jmenovatel}
                </small>
            </td>
        <td>
            <button class="btn btn-sm btn-warning" onclick="controller.zacitEditaciHlasovani('${h.casVytvoreni.toISOString()}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="controller.smazatHlasovani('${h.casVytvoreni.toISOString()}')">
                <i class="fas fa-trash"></i>
            </button>
            <button class="btn btn-sm btn-primary" onclick="controller.generovatHlasovaniPDF('${h.casVytvoreni.toISOString()}')">
                <i class="fas fa-file-pdf"></i>
            </button>
        </td>
    </tr>
    `;
}).join('');
}


    
    zobrazChybu(zprava) {
        alert('Chyba: ' + zprava);
    }

    zobrazCasovouOsu(osa) {
    this.casovaOsaBody.innerHTML = osa.map(entry => `
        <tr>
            <td>${entry.cas.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}</td>
            <td>${entry.pocetPritomnych}</td>
            <td>${entry.podilPritomnych.toFixed(2)}%</td>
            <td>
                <button class="btn btn-sm btn-pdf" 
                        onclick="controller.generovatDochazkuPDF(${entry.cas.getTime()})"
                        title="Generovat PDF">
                    <i class="fas fa-file-pdf"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

       
    toggleDochazka() {
        const element = document.getElementById('dochazkaList');
        if (element) {
            element.classList.toggle('d-none');
        }
    }

    toggleCasovaOsa() {
        const element = document.getElementById('casovaOsaSection');
        if (element) {
            element.classList.toggle('d-none');
        }
    }
}
