import { Router } from 'express';
import { ensureAuth, requireRole } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { asyncHandler } from '../middlewares/asyncHandler'; // ajusta el path si tu archivo se llama distinto

import {
    mesaIdParams, carritoIdParams, pedidoIdParams, itemIdParams,
    transferirSchema, cancelarSchema,
    addCarritoItemSchema, editCarritoItemSchema,
    addPedidoItemSchema, editPedidoItemSchema
} from '../validation/mesero.schemas';
import { 
    abrirMesa, addCarritoItem, editCarritoItem, enviarACocina,
    getCarrito, getCarritoActivoByMesa, limpiarCarrito, listMesasMesero, removeCarritoItem 
} from '../controllers/mesero.controller';
import { addPedidoItem, editPedidoItem, ensurePedidoEditable, getPedido, listMisPedidos, removePedidoItem, transferirPedido } from '../controllers/pedidos.controller';


const router = Router();
router.use(ensureAuth, requireRole('MESERO'));

/** Mesas */
router.get('/mesas', asyncHandler(listMesasMesero));
router.post('/mesas/:id/abrir',
    validate(mesaIdParams, 'params'),
    asyncHandler(abrirMesa)
);
router.get('/mesas/:id/carrito',
    validate(mesaIdParams, 'params'),
    asyncHandler(getCarritoActivoByMesa)
);

/** Carrito (sobre id de carrito) */
router.get('/carritos/:id',
    validate(carritoIdParams, 'params'),
    asyncHandler(getCarrito)
);
router.post('/carritos/:id/items',
    validate(carritoIdParams, 'params'),
    validate(addCarritoItemSchema),
    asyncHandler(addCarritoItem)
);
router.put('/carritos/:id/items/:itemId',
    validate(carritoIdParams.merge(itemIdParams), 'params'),
    validate(editCarritoItemSchema),
    asyncHandler(editCarritoItem)
);
router.delete('/carritos/:id/items/:itemId',
    validate(carritoIdParams.merge(itemIdParams), 'params'),
    asyncHandler(removeCarritoItem)
);
router.post('/carritos/:id/enviar-cocina',
    validate(carritoIdParams, 'params'),
    asyncHandler(enviarACocina)
);

router.post('/carritos/:id/limpiar', 
    validate(carritoIdParams, 'params'),
    asyncHandler(limpiarCarrito)
);


/** Pedidos (EN_PROCESO) */
router.get('/pedidos', asyncHandler(listMisPedidos));
router.get('/pedidos/:id',
    validate(pedidoIdParams, 'params'),
    asyncHandler(getPedido)
);
router.post('/pedidos/:id/items',
    validate(pedidoIdParams, 'params'),
    validate(addPedidoItemSchema),
    asyncHandler(ensurePedidoEditable),
    asyncHandler(addPedidoItem)
);
router.put('/pedidos/:id/items/:itemId',
    validate(pedidoIdParams.merge(itemIdParams), 'params'),
    validate(editPedidoItemSchema),
    asyncHandler(ensurePedidoEditable),
    asyncHandler(editPedidoItem)
);
router.delete('/pedidos/:id/items/:itemId',
    validate(pedidoIdParams.merge(itemIdParams), 'params'),
    asyncHandler(ensurePedidoEditable),
    asyncHandler(removePedidoItem)
);

router.post('/pedidos/:id/transferir',
    validate(pedidoIdParams, 'params'),
    asyncHandler(ensurePedidoEditable),
    asyncHandler(transferirPedido)
);

export default router;
