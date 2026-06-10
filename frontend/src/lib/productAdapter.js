import bleuDeChanel1 from "../assets/bleu-de-chanel-1.avif";
import bleuDeChanel2 from "../assets/bleu-de-chanel-2.avif";

const productImages = {
  1: {
    mainImage: bleuDeChanel1,
    thumbnails: [bleuDeChanel1, bleuDeChanel2],
  },
  2: {
    mainImage:
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=300&q=80",
    ],
  },
  3: {
    mainImage:
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=300&q=80",
    ],
  },
  4: {
    mainImage:
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6f?auto=format&fit=crop&w=900&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6f?auto=format&fit=crop&w=300&q=80",
    ],
  },
};

const fallbackImages = productImages[1];

export function adaptProduct(apiProduct, category) {
  const images = productImages[apiProduct.id] ?? fallbackImages;

  return {
    apiId: apiProduct.id,
    id: String(apiProduct.id),
    name: apiProduct.name,
    volume: apiProduct.model,
    price: Number(apiProduct.price),
    currency: "USD",
    stock: apiProduct.quantity_in_stock,
    averageRating: Number(apiProduct.average_rating ?? 0),
    ratingCount: Number(apiProduct.rating_count ?? 0),
    categoryId: apiProduct.category_id,
    categoryName: category?.name ?? "",
    shortDescription: apiProduct.description,
    features: [
      category?.name,
      apiProduct.warranty_status,
      apiProduct.distributor_info,
    ].filter(Boolean),
    details: [
      apiProduct.description,
      apiProduct.warranty_status ? `Warranty: ${apiProduct.warranty_status}` : null,
      apiProduct.distributor_info ? `Distributor: ${apiProduct.distributor_info}` : null,
      apiProduct.serial_number ? `Serial number: ${apiProduct.serial_number}` : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
    mainImage: images.mainImage,
    thumbnails: images.thumbnails,
    fallbackImage: fallbackImages.mainImage,
  };
}
