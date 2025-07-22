-- Add hierarchy fields to tags table
ALTER TABLE tags 
ADD COLUMN parent_id UUID REFERENCES tags(id) ON DELETE CASCADE,
ADD COLUMN tag_type TEXT CHECK (tag_type IN ('category', 'subcategory')) DEFAULT 'subcategory',
ADD COLUMN sort_order INTEGER DEFAULT 0,
ADD COLUMN is_system BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX idx_tags_parent_id ON tags(parent_id);
CREATE INDEX idx_tags_tag_type ON tags(tag_type);
CREATE INDEX idx_tags_sort_order ON tags(sort_order);
CREATE INDEX idx_tags_is_system ON tags(is_system);

-- Update existing tags to be subcategories (backward compatibility)
UPDATE tags SET tag_type = 'subcategory' WHERE tag_type IS NULL;
