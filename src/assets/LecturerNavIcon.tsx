"use client";

import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

export default function LecturerNavIcon({
	width = 24,
	color: defaultColor,
}: {
	width?: number;
	color?: string;
}) {
	const { theme } = useTheme();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => setIsMounted(true), []);

	const color = useMemo(
		() => defaultColor || (theme == "light" ? "black" : "white"),
		[theme, defaultColor]
	);

	return (
		<>
			{isMounted ? (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width={width}
					height={width}
					viewBox="0 0 24 24"
					fill="none"
				>
					<path
						fillRule="evenodd"
						clipRule="evenodd"
						d="M12 5C11.4696 5 10.9609 5.21071 10.5858 5.58579C10.2107 5.96086 10 6.46957 10 7C10 7.53043 10.2107 8.03914 10.5858 8.41421C10.9609 8.78929 11.4696 9 12 9C12.5304 9 13.0391 8.78929 13.4142 8.41421C13.7893 8.03914 14 7.53043 14 7C14 6.46957 13.7893 5.96086 13.4142 5.58579C13.0391 5.21071 12.5304 5 12 5ZM9.17157 4.17157C9.92172 3.42143 10.9391 3 12 3C13.0609 3 14.0783 3.42143 14.8284 4.17157C15.5786 4.92172 16 5.93913 16 7C16 8.06087 15.5786 9.07828 14.8284 9.82843C14.0783 10.5786 13.0609 11 12 11C10.9391 11 9.92172 10.5786 9.17157 9.82843C8.42143 9.07828 8 8.06087 8 7C8 5.93913 8.42143 4.92172 9.17157 4.17157ZM5 9C4.73478 9 4.48043 9.10536 4.29289 9.29289C4.10536 9.48043 4 9.73478 4 10C4 10.2652 4.10536 10.5196 4.29289 10.7071C4.48043 10.8946 4.73478 11 5 11C5.26522 11 5.51957 10.8946 5.70711 10.7071C5.89464 10.5196 6 10.2652 6 10C6 9.73478 5.89464 9.48043 5.70711 9.29289C5.51957 9.10536 5.26522 9 5 9ZM2.87868 7.87868C3.44129 7.31607 4.20435 7 5 7C5.79565 7 6.55871 7.31607 7.12132 7.87868C7.68393 8.44129 8 9.20435 8 10C8 10.7956 7.68393 11.5587 7.12132 12.1213C6.55871 12.6839 5.79565 13 5 13C4.20435 13 3.44129 12.6839 2.87868 12.1213C2.31607 11.5587 2 10.7956 2 10C2 9.20435 2.31607 8.44129 2.87868 7.87868ZM19 9C18.7348 9 18.4804 9.10536 18.2929 9.29289C18.1054 9.48043 18 9.73478 18 10C18 10.2652 18.1054 10.5196 18.2929 10.7071C18.4804 10.8946 18.7348 11 19 11C19.2652 11 19.5196 10.8946 19.7071 10.7071C19.8946 10.5196 20 10.2652 20 10C20 9.73478 19.8946 9.48043 19.7071 9.29289C19.5196 9.10536 19.2652 9 19 9ZM16.8787 7.87868C17.4413 7.31607 18.2043 7 19 7C19.7957 7 20.5587 7.31607 21.1213 7.87868C21.6839 8.44129 22 9.20435 22 10C22 10.7957 21.6839 11.5587 21.1213 12.1213C20.5587 12.6839 19.7957 13 19 13C18.2043 13 17.4413 12.6839 16.8787 12.1213C16.3161 11.5587 16 10.7957 16 10C16 9.20435 16.3161 8.44129 16.8787 7.87868ZM12 13.9993C11.2003 13.9993 10.4189 14.2389 9.75658 14.6872C9.09862 15.1326 8.58824 15.7637 8.29027 16.5C8.28633 16.5103 8.28221 16.5206 8.27792 16.5308C8.09876 16.9837 8 17.479 8 18V19H16V18C16 17.479 15.9012 16.9837 15.7221 16.5309C15.7178 16.5206 15.7137 16.5103 15.7097 16.5C15.4118 15.7637 14.9014 15.1326 14.2434 14.6872C13.5811 14.2389 12.7997 13.9993 12 13.9993ZM17.7871 16.41C17.9262 16.9175 18 17.451 18 18V19H21V18.0001C21 18 21 18.0001 21 18.0001C21 17.5845 20.8704 17.1791 20.6294 16.8405C20.3884 16.5019 20.0479 16.2467 19.6552 16.1106C19.2625 15.9744 18.8371 15.964 18.4382 16.0808C18.2014 16.1501 17.981 16.2621 17.7871 16.41ZM16.9298 14.5776C17.2242 14.3995 17.5422 14.2591 17.8763 14.1613C18.6742 13.9278 19.5249 13.9486 20.3103 14.2209C21.0958 14.4932 21.7768 15.0035 22.2589 15.6808C22.7409 16.358 22.9999 17.1686 23 17.9999V20C23 20.5523 22.5523 21 22 21H2C1.44772 21 1 20.5523 1 20V18C1.00006 17.1687 1.25911 16.358 1.74115 15.6808C2.22318 15.0035 2.90425 14.4932 3.68967 14.2209C4.47509 13.9486 5.32584 13.9278 6.12365 14.1613C6.45782 14.2591 6.77575 14.3995 7.07024 14.5776C7.49002 13.9732 8.01963 13.4479 8.63543 13.031C9.62867 12.3587 10.8006 11.9993 12 11.9993C13.1994 11.9993 14.3713 12.3587 15.3646 13.031C15.9804 13.4479 16.51 13.9732 16.9298 14.5776ZM6.21295 16.41C6.01904 16.2621 5.79859 16.1501 5.56183 16.0808C5.16292 15.964 4.73754 15.9744 4.34483 16.1106C3.95212 16.2467 3.61159 16.5019 3.37057 16.8405C3.12957 17.1791 3.00005 17.5844 3 18C3 18 3 18 3 18V19H6V18C6 17.451 6.07383 16.9175 6.21295 16.41Z"
						fill={color}
					/>
				</svg>
			) : null}
		</>
	);
}
