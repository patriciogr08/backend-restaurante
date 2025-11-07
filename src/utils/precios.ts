export function round2(n: number) { 
    return Math.round(n * 100) / 100; 
}

export function aplicarDescuento(base: number, tiene: boolean, pct?: number, val?: number) {
    if (!tiene) return base;
    let x = base;
    if (pct) x -= (x * (pct / 100));
    if (val) x -= val;
    return Math.max(0, x);
}

export function pvpDesdeBase(baseSinIva: number, ivaPercent: number) {
    return round2(baseSinIva * (1 + (ivaPercent / 100)));
}
