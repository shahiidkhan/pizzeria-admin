// src/hooks/useOffers.js
import { useState, useEffect, useCallback } from 'react';
import { offerService } from '../services/offerService';
import { productService } from '../services/productService';

export function useOffers() {
  const [offers, setOffers] = useState([]);
  const [productsById, setProductsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let offersReady = false;
    let productsReady = false;

    const finalize = () => {
      if (offersReady && productsReady) setLoading(false);
    };

    const unsubOffers = offerService.subscribe(
      data => {
        setOffers(data);
        offersReady = true;
        finalize();
      },
      err => {
        setError(err.message);
        setLoading(false);
      }
    );

    const unsubProducts = productService.subscribe(data => {
      const next = data.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {});
      setProductsById(next);
      productsReady = true;
      finalize();
    });

    return () => {
      unsubOffers();
      unsubProducts();
    };
  }, []);

  const addOffer = useCallback(async (data) => {
    await offerService.add(data);
  }, []);

  const removeOffer = useCallback(async (id) => {
    await offerService.remove(id);
  }, []);

  const hydratedOffers = offers.map(offer => {
    const product = productsById[offer.productId] || {};
    const originalPrice = Number(product.price ?? offer.originalPrice ?? 0);
    const discountPrice = Number(offer.discountPrice ?? 0);
    const discountPercent = originalPrice > 0
      ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
      : 0;

    return {
      ...offer,
      productName: product.name ?? offer.productName ?? 'Unknown Product',
      productImage: product.image ?? offer.productImage ?? '',
      originalPrice,
      discountPrice,
      discountPercent,
    };
  });

  return { offers: hydratedOffers, loading, error, addOffer, removeOffer };
}
