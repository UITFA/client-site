/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";

export default function useMultipleFetch<T>(urls: string[]) {
	const [items, setItems] = useState<T[]>([]);
	// const [isLoading, setIsLoading] = useState<boolean>(false);
	const isLoading = useRef(true);

	useEffect(() => {
		console.log("fetching");
		(async () => {
			isLoading.current = true;
			const data = await Promise.all(
				urls.map((url) => fetch(url).then((r) => r.json()))
			);

			setItems(data);
			isLoading.current = false;
		})();
	}, [JSON.stringify(urls)]);

	return { data: items, isLoading };
}
