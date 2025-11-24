
import { Request, Response } from 'express';
import { buildReporteMeserosData, buildReporteProductosData, buildReporteVentasData } from '../utils/reportes';
import ExcelJS from 'exceljs';


export async function getReporteVentas(req: Request, res: Response) {
    try {
        const data = await buildReporteVentasData(req);
        return res.json(data);
    } catch (err) {
        console.error('[ADMIN][Reportes] Error en getReporteVentas', err);
        return res.status(500).json({ message: 'Error al obtener reporte de ventas' });
    }
}

export async function getReporteProductos(req: Request, res: Response) {
    try {
        const data = await buildReporteProductosData(req);
        return res.json(data);
    } catch (err) {
        console.error('[ADMIN][Reportes] Error en getReporteProductos', err);
        return res.status(500).json({ message: 'Error al obtener reporte de productos' });
    }
}

export async function getReporteMeseros(req: Request, res: Response) {
    try {
        const data = await buildReporteMeserosData(req);
        return res.json(data);
    } catch (err) {
        console.error('[ADMIN][Reportes] Error en getReporteMeseros', err);
        return res.status(500).json({ message: 'Error al obtener reporte de meseros' });
    }
}



export async function exportReporteVentasExcel(req: Request, res: Response) {
    try {
        const data = await buildReporteVentasData(req);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Ventas');

        // Título opcional
        sheet.mergeCells('A1:I1');
        sheet.getCell('A1').value = `Reporte de ventas ${data.fechaDesde} a ${data.fechaHasta}`;
        sheet.getCell('A1').font = { bold: true, size: 14 };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        // Encabezados
        const headerRow = sheet.addRow([
        'Factura ID',
        'Número',
        'Fecha',
        'Hora',
        'Mesa',
        'Mesero',
        'Método pago',
        'Total',
        'Propina',
        ]);

        headerRow.font = { bold: true };
        headerRow.eachCell((cell) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' }, // gris claro
        };
        });

        // Filas de datos
        for (const r of data.rows) {
        sheet.addRow([
            r.facturaId,
            r.numero,
            r.fecha,
            r.hora,
            r.mesaNumero ?? '',
            r.meseroNombre ?? '',
            r.metodoPago,
            r.total,
            r.propina,
        ]);
        }

        // Totales al final (una fila en blanco + resumen)
        sheet.addRow([]);
        const resumenRow = sheet.addRow([
        '',
        '',
        '',
        '',
        '',
        '',
        'Totales:',
        data.totalFacturado,
        data.totalPropina,
        ]);
        resumenRow.font = { bold: true };

        // Ajustar ancho de columnas simple
        sheet.columns.forEach((col) => {
        if (!col) return;
        let maxLength = 10;
        if (typeof col.eachCell === 'function') {
            col.eachCell({ includeEmpty: true }, (cell) => {
                const v = cell.value;
                if (!v) return;
                const len = String(v).length;
                if (len > maxLength) maxLength = len;
            });
        }
        col.width = maxLength + 2;
        });

        res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
        'Content-Disposition',
        `attachment; filename="reporte_ventas_${data.fechaDesde}_a_${data.fechaHasta}.xlsx"`,
        );

        // Escribir directamente al response
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('[ADMIN][Reportes] Error en exportReporteVentasExcel', err);
        return res.status(500).send('Error al exportar Excel');
    }
}

export async function exportReporteProductosExcel(req: Request, res: Response) {
    try {
        const data = await buildReporteProductosData(req);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Productos');

        // Título
        sheet.mergeCells('A1:D1');
        sheet.getCell('A1').value = `Reporte de productos ${data.fechaDesde} a ${data.fechaHasta}`;
        sheet.getCell('A1').font = { bold: true, size: 14 };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        // Encabezados
        const header = sheet.addRow(['Producto', 'Cantidad vendida' , 'Categoria Produto', 'Total vendido', 'Precio promedio']);
        header.font = { bold: true };
        header.eachCell((cell) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' },
        };
        });

        // Filas
        for (const r of data.rows) {
        const precioPromedio =
            r.cantidadVendida > 0 ? r.totalVendido / r.cantidadVendida : 0;

        sheet.addRow([
            r.nombre,
            r.categoriaNombre,
            r.cantidadVendida,
            r.totalVendido,
            precioPromedio,
        ]);
        }

        // Fila de totales
        sheet.addRow([]);
        const resumen = sheet.addRow([
        'Totales:',
        data.totalCantidad,
        data.totalMonto,
        '',
        ]);
        resumen.font = { bold: true };

        // Ajuste de columnas
        sheet.columns.forEach((col) => {
        if (!col || typeof col.eachCell !== 'function') return;
        let max = 10;
        col.eachCell({ includeEmpty: true }, (cell) => {
            const v = cell.value;
            if (!v) return;
            const len = String(v).length;
            if (len > max) max = len;
        });
        col.width = max + 2;
        });

        res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
        'Content-Disposition',
        `attachment; filename="reporte_productos_${data.fechaDesde}_a_${data.fechaHasta}.xlsx"`,
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('[ADMIN][Reportes] Error en exportReporteProductosExcel', err);
        return res.status(500).send('Error al exportar Excel de productos');
    }
}

export async function exportReporteMeserosExcel(req: Request, res: Response) {
    try {
        const data = await buildReporteMeserosData(req);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Meseros');

        // Título
        sheet.mergeCells('A1:F1');
        sheet.getCell('A1').value = `Reporte por mesero ${data.fechaDesde} a ${data.fechaHasta}`;
        sheet.getCell('A1').font = { bold: true, size: 14 };
        sheet.getCell('A1').alignment = { horizontal: 'center' };

        // Encabezados
        const header = sheet.addRow([
        'Mesero',
        'Pedidos',
        'Total facturado',
        'Total propina',
        'Ticket promedio',
        'Participación (%)',
        ]);
        header.font = { bold: true };
        header.eachCell((cell) => {
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
        };
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' },
        };
        });

        // Filas
        for (const r of data.rows) {
        const participacion =
            data.totalFacturado > 0
            ? (r.totalFacturado / data.totalFacturado) * 100
            : 0;

        sheet.addRow([
            r.meseroNombre,
            r.cantidadPedidos,
            r.totalFacturado,
            r.totalPropina,
            r.ticketPromedio,
            participacion,
        ]);
        }

        // Totales
        sheet.addRow([]);
        const resumen = sheet.addRow([
        'Totales:',
        data.totalPedidos,
        data.totalFacturado,
        data.totalPropina,
        '',
        '',
        ]);
        resumen.font = { bold: true };

        // Ajuste de columnas
        sheet.columns.forEach((col) => {
        if (!col || typeof col.eachCell !== 'function') return;
        let max = 10;
        col.eachCell({ includeEmpty: true }, (cell) => {
            const v = cell.value;
            if (!v) return;
            const len = String(v).length;
            if (len > max) max = len;
        });
        col.width = max + 2;
        });

        res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
        'Content-Disposition',
        `attachment; filename="reporte_meseros_${data.fechaDesde}_a_${data.fechaHasta}.xlsx"`,
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('[ADMIN][Reportes] Error en exportReporteMeserosExcel', err);
        return res.status(500).send('Error al exportar Excel de meseros');
    }
}


