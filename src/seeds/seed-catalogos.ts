// src/seeds/seed-catalogos.ts
import { AppDataSource } from '../config/data-source';
import { TipoProducto } from '../domain/entities/TipoProducto';
import { Producto } from '../domain/entities/Producto';
import { In } from 'typeorm';

export async function seedCatalogos() {
    const tipoRepo = AppDataSource.getRepository(TipoProducto);
    const prodRepo = AppDataSource.getRepository(Producto);

    const nombres = ['Ceviches', 'Arroces', 'Pescados', 'Jugos'];

    // ✅ usar In() en lugar de pasar un array directo
    const existentes = await tipoRepo.findBy({ nombre: In(nombres) });
    const ya = new Set(existentes.map(t => t.nombre));

    const porCrear = nombres
        .filter(n => !ya.has(n))
        .map(nombre => tipoRepo.create({ nombre, estado: 'ACTIVO' }));

    const nuevos = porCrear.length ? await tipoRepo.save(porCrear) : [];
    const todos = [...existentes, ...nuevos];

    // Mapa nombre -> id
    const mapId = new Map(todos.map(t => [t.nombre, t.id]));

    // Si ya hay productos, no sembrar de nuevo
    const prodCount = await prodRepo.count();
    if (prodCount > 0) {
        return { tiposCreados: nuevos.length, productosCreados: 0, skipped: true };
    }

    const productos = [
        { tipo: 'Ceviches', nombre: 'Ceviche Mixto',  precio: '8.50', tieneDescuento: true,  descuentoPorcentaje: '10.00', descuentoValor: '0.00' },
        { tipo: 'Arroces',  nombre: 'Arroz Marinero', precio: '7.00',  tieneDescuento: false, descuentoPorcentaje: '0.00', descuentoValor: '0.00' },
        { tipo: 'Pescados', nombre: 'Pescado Frito',  precio: '6.50',  tieneDescuento: true,  descuentoPorcentaje: '0.00', descuentoValor: '1.00' },
        { tipo: 'Jugos',    nombre: 'Jugo de Naranja',precio: '2.00',  tieneDescuento: false, descuentoPorcentaje: '0.00', descuentoValor: '0.00' },
    ].map(p => prodRepo.create({
        tipoProductoId: mapId.get(p.tipo)!,
        nombre: p.nombre,
        precio: p.precio,
        estado: 'ACTIVO',
        tieneDescuento: p.tieneDescuento,
        descuentoPorcentaje: p.descuentoPorcentaje,
        descuentoValor: p.descuentoValor
    }));

    await prodRepo.save(productos);
    return { tiposCreados: nuevos.length, productosCreados: productos.length, skipped: false };
}
