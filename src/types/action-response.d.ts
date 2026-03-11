export type ActionResponse<T = void> =
	| {
			success: true
			message: string
			data: T
	  }
	| {
			success: false
			message: string
			errors?: Record<string, string[]>
	  }
