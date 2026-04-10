import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Plus, X, Package2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { recipeService } from '../../services/recipeService';
import { toast } from '../../components/ui/use-toast';

interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
  estimated_price?: number;
  completed?: boolean;
  notes?: string;
  recipe_ids?: string[];
}

const CreateShoppingList: React.FC = () => {
  const navigate = useNavigate();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [store, setStore] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [estimatedTotal, setEstimatedTotal] = useState<number | undefined>();
  
  // Current item being added
  const [currentItem, setCurrentItem] = useState<ShoppingItem>({
    name: '',
    quantity: '',
    category: '',
    estimated_price: undefined,
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);

  const categoryOptions = [
    'meat',
    'vegetables', 
    'fruits',
    'dairy',
    'grains',
    'pantry',
    'spices',
    'beverages',
    'frozen',
    'bakery',
    'snacks',
    'other'
  ];

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddItem = () => {
    if (currentItem.name.trim() && currentItem.quantity.trim()) {
      const newItem: ShoppingItem = {
        ...currentItem,
        category: currentItem.category || 'other',
        completed: false
      };
      
      setItems([...items, newItem]);
      setCurrentItem({
        name: '',
        quantity: '',
        category: '',
        estimated_price: undefined,
        notes: ''
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof ShoppingItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.estimated_price || 0), 0);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a shopping list name',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const shoppingListData = {
        name: name.trim(),
        description: description.trim() || undefined,
        items,
        store: store.trim() || undefined,
        estimated_total: estimatedTotal || calculateTotal(),
        tags,
        metadata: {}
      };

      await recipeService.createShoppingList(shoppingListData);
      
      toast({
        title: 'Success',
        description: 'Shopping list created successfully!'
      });

      navigate('/recipe-builder');
    } catch (error) {
      console.error('Failed to create shopping list:', error);
      toast({
        title: 'Error',
        description: 'Failed to create shopping list. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="rounded-full h-10 w-10 p-0 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 hover:scale-110 shadow-md hover:shadow-lg"
              title="Back to Shopping Lists"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <ShoppingBag className="h-8 w-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Shopping List
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Organize your grocery shopping
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for your shopping list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">List Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Weekly Groceries"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="store">Store (optional)</Label>
                  <Input
                    id="store"
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    placeholder="e.g., Whole Foods, Walmart"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes about this shopping list..."
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags (optional)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="tags"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tag and press Enter"
                    className="flex-1"
                  />
                  <Button type="button" size="sm" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add Items */}
          <Card>
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
              <CardDescription>
                Add items to your shopping list
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                <div className="md:col-span-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={currentItem.name}
                    onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                    placeholder="e.g., Chicken breast"
                  />
                </div>
                <div>
                  <Label htmlFor="item-quantity">Quantity</Label>
                  <Input
                    id="item-quantity"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})}
                    placeholder="e.g., 2 lbs"
                  />
                </div>
                <div>
                  <Label htmlFor="item-category">Category</Label>
                  <Select
                    value={currentItem.category}
                    onValueChange={(value) => setCurrentItem({...currentItem, category: value})}
                  >
                    <SelectTrigger id="item-category">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="item-price">Price ($)</Label>
                  <Input
                    id="item-price"
                    type="number"
                    step="0.01"
                    value={currentItem.estimated_price || ''}
                    onChange={(e) => setCurrentItem({
                      ...currentItem, 
                      estimated_price: e.target.value ? parseFloat(e.target.value) : undefined
                    })}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddItem} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Notes for current item */}
              <div className="mb-4">
                <Label htmlFor="item-notes">Notes (optional)</Label>
                <Input
                  id="item-notes"
                  value={currentItem.notes || ''}
                  onChange={(e) => setCurrentItem({...currentItem, notes: e.target.value})}
                  placeholder="Any additional notes for this item..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Items List */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Items ({items.length})</span>
                  <span className="text-lg font-bold text-green-600">
                    ${calculateTotal().toFixed(2)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Package2 className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.quantity}</p>
                        </div>
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                        <div>
                          {item.estimated_price && (
                            <p className="text-sm font-medium text-green-600">
                              ${item.estimated_price.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <div>
                          {item.notes && (
                            <p className="text-sm text-gray-500 truncate">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary & Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {items.length} items • Estimated total: ${calculateTotal().toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/recipe-builder')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !name.trim()}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Shopping List'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CreateShoppingList;