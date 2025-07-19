import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tag, TagType } from "@/types";

interface TagFormData {
    name: string;
    color: string;
    tagType: TagType;
    parentId?: string;
    sortOrder?: number;
}

interface HierarchicalTagFormProps {
    formData: TagFormData;
    categories: Tag[];
    onFormDataChange: (updates: Partial<TagFormData>) => void;
    onSubmit: (e: React.FormEvent) => void;
    isSubmitting: boolean;
    submitButtonText: string;
    error?: Error | null;
    mode: "create" | "edit";
}

export function HierarchicalTagForm({
    formData,
    categories,
    onFormDataChange,
    onSubmit,
    isSubmitting,
    submitButtonText,
    error,
    mode,
}: HierarchicalTagFormProps) {
    const isCategory = formData.tagType === "category";
    const requiresParent = formData.tagType === "subcategory";

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Tag Type Selection */}
            <div className="space-y-3">
                <Label>Tag Type</Label>
                <RadioGroup
                    value={formData.tagType}
                    onValueChange={(value: TagType) => onFormDataChange({ tagType: value, parentId: undefined })}
                    className="flex space-x-6"
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="category" id="category" />
                        <Label htmlFor="category" className="font-normal">
                            Category
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="subcategory" id="subcategory" />
                        <Label htmlFor="subcategory" className="font-normal">
                            Subcategory
                        </Label>
                    </div>
                </RadioGroup>
                <p className="text-sm text-muted-foreground">
                    {isCategory
                        ? "Categories are top-level groupings for organizing issue types"
                        : "Subcategories are specific issue types within a category"}
                </p>
            </div>

            {/* Parent Category Selection (for subcategories) */}
            {requiresParent && (
                <div className="space-y-2">
                    <Label htmlFor="parentCategory">Parent Category *</Label>
                    <Select
                        value={formData.parentId || ""}
                        onValueChange={(value) => onFormDataChange({ parentId: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a parent category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: category.color || "#6B7280" }}
                                        />
                                        <span>{category.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {requiresParent && !formData.parentId && (
                        <p className="text-sm text-destructive">Please select a parent category</p>
                    )}
                </div>
            )}

            {/* Tag Name */}
            <div className="space-y-2">
                <Label htmlFor="tagName">Name *</Label>
                <Input
                    id="tagName"
                    value={formData.name}
                    onChange={(e) => onFormDataChange({ name: e.target.value })}
                    placeholder={`Enter ${formData.tagType} name`}
                    className={cn(!formData.name.trim() && "border-destructive")}
                />
                {!formData.name.trim() && (
                    <p className="text-sm text-destructive">Name is required</p>
                )}
            </div>

            {/* Tag Color */}
            <div className="space-y-2">
                <Label htmlFor="tagColor">Color</Label>
                <div className="flex items-center space-x-3">
                    <Input
                        type="color"
                        id="tagColor"
                        value={formData.color}
                        onChange={(e) => onFormDataChange({ color: e.target.value })}
                        className="w-16 h-10 p-1 border rounded cursor-pointer"
                    />
                    <Input
                        type="text"
                        value={formData.color}
                        onChange={(e) => onFormDataChange({ color: e.target.value })}
                        placeholder="#3B82F6"
                        className="flex-1"
                    />
                </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                    type="number"
                    id="sortOrder"
                    value={formData.sortOrder || 0}
                    onChange={(e) => onFormDataChange({ sortOrder: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-24"
                />
                <p className="text-sm text-muted-foreground">
                    Lower numbers appear first in lists
                </p>
            </div>

            {/* Error Display */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error instanceof Error ? error.message : "An error occurred"}
                    </AlertDescription>
                </Alert>
            )}

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full"
                disabled={
                    isSubmitting ||
                    !formData.name.trim() ||
                    (requiresParent && !formData.parentId)
                }
            >
                {isSubmitting ? "Saving..." : submitButtonText}
            </Button>
        </form>
    );
} 
