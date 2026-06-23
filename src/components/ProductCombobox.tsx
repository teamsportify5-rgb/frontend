import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ProductComboboxProps = {
  id?: string
  label?: string
  value: string
  onChange: (value: string) => void
  products: string[]
  placeholder?: string
  disabled?: boolean
}

export function ProductCombobox({
  id = 'product',
  label = 'Product *',
  value,
  onChange,
  products,
  placeholder = 'Type or select a product',
  disabled,
}: ProductComboboxProps) {
  const listId = `${id}-suggestions`

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
      <datalist id={listId}>
        {products.map((product) => (
          <option key={product} value={product} />
        ))}
      </datalist>
      <p className="text-xs text-muted-foreground">
        Choose from inventory suggestions or enter a custom product name.
      </p>
    </div>
  )
}
