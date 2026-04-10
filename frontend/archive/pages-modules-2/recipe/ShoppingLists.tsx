import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Plus, Package, Check, X, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { recipeService } from '../../services/recipeService';
import { toast } from '../../components/ui/use-toast';

const ShoppingLists: React.FC = () => {
  const navigate = useNavigate();
  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedList, setSelectedList] = useState<any>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [selectedListDetail, setSelectedListDetail] = useState<any>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  useEffect(() => {
    loadShoppingLists();
  }, []);

  const loadShoppingLists = async () => {
    setLoading(true);
    try {
      const response = await recipeService.getShoppingLists({ limit: 20 });
      console.log('Shopping lists response:', response);
      
      // Handle different response structures
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          setShoppingLists(response);
        } else if (response.data && Array.isArray(response.data)) {
          setShoppingLists(response.data);
        } else if (response.data && typeof response.data === 'object') {
          // Handle paginated response
          setShoppingLists(response.data.data || response.data.shopping_lists || []);
        } else {
          setShoppingLists([]);
        }
      } else {
        setShoppingLists([]);
      }
    } catch (error) {
      console.error('Failed to load shopping lists:', error);
      setShoppingLists([]);
      toast({ 
        title: 'Failed to load shopping lists', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName) return;

    try {
      await recipeService.createShoppingList({
        name: newListName,
        description: newListDescription,
        items: []
      });
      toast({ title: 'Shopping list created successfully' });
      setCreateDialogOpen(false);
      setNewListName('');
      setNewListDescription('');
      loadShoppingLists();
    } catch (error) {
      toast({ title: 'Failed to create shopping list', variant: 'destructive' });
    }
  };

  const handleViewList = async (list: any) => {
    try {
      const fullList = await recipeService.getShoppingList(list.id);
      console.log('Full list response:', fullList);
      setSelectedListDetail(fullList);
      setListDialogOpen(true);
    } catch (error) {
      console.error('Failed to load shopping list:', error);
      toast({ 
        title: 'Failed to load shopping list', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive' 
      });
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this shopping list?')) return;

    try {
      await recipeService.deleteShoppingList(listId);
      toast({ title: 'Shopping list deleted' });
      loadShoppingLists();
    } catch (error) {
      toast({ title: 'Failed to delete shopping list', variant: 'destructive' });
    }
  };

  const handleAddItem = async () => {
    if (!selectedListDetail || !newItemName || !newItemQuantity) return;

    try {
      // Check if the service method exists
      if (!recipeService.addItemToShoppingList) {
        console.warn('addItemToShoppingList method not available');
        toast({ title: 'Feature not yet implemented', variant: 'destructive' });
        return;
      }

      const updated = await recipeService.addItemToShoppingList(selectedListDetail.id, {
        name: newItemName,
        quantity: newItemQuantity,
        category: newItemCategory || 'Other'
      });
      setSelectedListDetail(updated);
      setNewItemName('');
      setNewItemQuantity('');
      setNewItemCategory('');
      toast({ title: 'Item added successfully' });
      loadShoppingLists();
    } catch (error) {
      console.error('Failed to add item:', error);
      toast({ 
        title: 'Failed to add item', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive' 
      });
    }
  };

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    if (!selectedListDetail || !itemId) return;

    try {
      // Check if the service method exists
      if (!recipeService.toggleShoppingListItem) {
        console.warn('toggleShoppingListItem method not available');
        toast({ title: 'Feature not yet implemented', variant: 'destructive' });
        return;
      }

      const updated = await recipeService.toggleShoppingListItem(
        selectedListDetail.id,
        itemId,
        !completed
      );
      setSelectedListDetail(updated);
      loadShoppingLists();
    } catch (error) {
      console.error('Failed to update item:', error);
      toast({ 
        title: 'Failed to update item', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive' 
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedListDetail || !itemId) return;

    try {
      // Check if the service method exists
      if (!recipeService.removeItemFromShoppingList) {
        console.warn('removeItemFromShoppingList method not available');
        toast({ title: 'Feature not yet implemented', variant: 'destructive' });
        return;
      }

      const updated = await recipeService.removeItemFromShoppingList(
        selectedListDetail.id,
        itemId
      );
      setSelectedListDetail(updated);
      loadShoppingLists();
      toast({ title: 'Item removed' });
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast({ 
        title: 'Failed to remove item', 
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive' 
      });
    }
  };

  const getCompletionPercentage = (list: any) => {
    try {
      // Handle different data structures for completion
      if (list?.completion_percentage !== undefined) {
        return typeof list.completion_percentage === 'number' ? list.completion_percentage : 0;
      }
      
      if (!list?.items || !Array.isArray(list.items) || list.items.length === 0) return 0;
      
      const completed = list.items.filter((item: any) => item?.completed === true).length;
      return Math.round((completed / list.items.length) * 100);
    } catch (error) {
      console.error('Error calculating completion percentage:', error);
      return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/recipe-builder')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Back
              </button>
              <ShoppingBag className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shopping Lists</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage your grocery shopping</p>
              </div>
            </div>
            <Button onClick={() => navigate('/recipe-builder/shopping/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New List
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : Array.isArray(shoppingLists) && shoppingLists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shoppingLists.map(list => {
              if (!list || !list.id) return null;
              const completion = getCompletionPercentage(list);
              return (
                <Card key={list.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleViewList(list)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{list.name}</CardTitle>
                        {list.description && (
                          <CardDescription className="mt-1">{list.description}</CardDescription>
                        )}
                      </div>
                      {completion === 100 && (
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Items:</span>
                        <span className="font-medium">{list.total_items || list.items?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                        <span className="font-medium">{completion}%</span>
                      </div>
                      {list.store && list.store !== 'string' && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Store:</span>
                          <span className="font-medium">{list.store}</span>
                        </div>
                      )}
                      <div>
                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div className="bg-primary h-2 rounded-full transition-all duration-300" 
                               style={{width: `${completion}%`}}></div>
                        </div>
                      </div>
                      <div className="flex justify-between pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewList(list);
                          }}
                        >
                          View Items
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(list.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No shopping lists yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first shopping list to start organizing your grocery trips
              </p>
              <Button onClick={() => navigate('/recipe-builder/shopping/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First List
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Create List Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Shopping List</DialogTitle>
            <DialogDescription>
              Create a new shopping list to organize your groceries
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">List Name</Label>
              <Input
                id="name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g., Weekly Groceries"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="Add notes about this shopping list..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateList}>Create List</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shopping List Detail Dialog */}
      <Dialog open={listDialogOpen} onOpenChange={setListDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedListDetail?.name}</DialogTitle>
            <DialogDescription>
              {selectedListDetail?.description || 'Manage your shopping list items'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Add new item */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add New Item</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Item name"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Quantity"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    className="w-32"
                  />
                  <Input
                    placeholder="Category"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-32"
                  />
                  <Button onClick={handleAddItem}>Add</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Items list */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedListDetail?.items && Array.isArray(selectedListDetail.items) ? selectedListDetail.items.map((item: any, index: number) => (
                    <div key={item.id || `item-${index}`} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Checkbox
                        checked={item.completed || false}
                        onCheckedChange={() => item.id && handleToggleItem(item.id, item.completed)}
                      />
                      <div className="flex-1">
                        <span className={item.completed ? 'line-through text-gray-500' : ''}>
                          {item.name}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {item.quantity}
                        </span>
                        {item.category && (
                          <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => item.id && handleRemoveItem(item.id)}
                        disabled={!item.id}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )) : (
                    <p className="text-center text-gray-500 py-4">No items in this list yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Progress */}
            <Card>
              <CardContent className="pt-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{getCompletionPercentage(selectedListDetail)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div className="bg-primary h-3 rounded-full transition-all duration-300" 
                         style={{width: `${getCompletionPercentage(selectedListDetail)}%`}}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShoppingLists;