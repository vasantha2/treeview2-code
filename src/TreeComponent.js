import React, { useState, useCallback, useEffect, useMemo } from "react";
import { VariableSizeList as List } from "react-window";
import TreeView from "@material-ui/lab/TreeView";
import TreeItem from "@material-ui/lab/TreeItem";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import HeightIcon from "@material-ui/icons/Height";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles({
  list: {
    height: "100%",
    overflow: "auto",
  },
});

const MemoizedTreeView = React.memo(TreeView);
const MemoizedTreeItem = React.memo(TreeItem);

const TreeComponent = ({ data }) => {
  const classes = useStyles();
  const [expanded, setExpanded] = useState([]);
  const [treeData, setTreeData] = useState([]);

  const loadChildren = (nodeId, data) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const children = data.filter((item) => item.parentId === nodeId);
        resolve(children);
      }, 1000);
    });
  };

  const buildTree = useCallback(
    async (items, parentId = null) => {
      const nodes = items.filter((item) => item.parentId === parentId);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.loading = true;

        if (!node.children) {
          try {
            const children = await loadChildren(node.id, data);
            node.children = children;
          } catch (error) {
            console.error("Error loading children:", error);
          } finally {
            node.loading = false;
          }
        }
      }

      return nodes;
    },
    [data]
  );

  useEffect(() => {
    const populateTreeData = async () => {
      const initialTreeData = await buildTree(data);
      setTreeData(initialTreeData);
    };

    populateTreeData();
  }, [buildTree, data]);

  const renderTree = useCallback(
    (nodes, expanded, setExpanded) => (
      <MemoizedTreeView
        defaultCollapseIcon={<ExpandMoreIcon />}
        defaultExpandIcon={<ChevronRightIcon />}
        expanded={expanded}
        onNodeToggle={(event, nodeIds) => setExpanded(nodeIds)}
      >
        {nodes.map((node) => {
          const { id, label, children, loading } = node;

          return (
            <MemoizedTreeItem
              key={id}
              nodeId={id}
              label={label}
              onLabelClick={() =>
                !loading && setExpanded([...expanded, node.id])
              }
            >
              {children && children.length > 0
                ? renderTree(children, expanded, setExpanded)
                : loading && <div>Loading...</div>}
            </MemoizedTreeItem>
          );
        })}
      </MemoizedTreeView>
    ),
    []
  );

  const expandAllNodes = useCallback(() => {
    const allNodeIds = [];

    const traverseTree = (nodes) => {
      nodes.forEach((node) => {
        allNodeIds.push(node.id);

        if (node.children && node.children.length > 0) {
          traverseTree(node.children);
        }
      });
    };

    traverseTree(treeData);
    setExpanded(allNodeIds);
  }, [treeData]);

  const collapseAllNodes = useCallback(() => {
    setExpanded([]);
  }, []);

  const itemSizes = useMemo(() => {
    const sizes = treeData.map(() => 600);
    return sizes;
  }, [treeData]);

  const rowRenderer = ({ index, style }) => {
    const item = treeData[index];

    return (
      <div style={style}>
        <MemoizedTreeView
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          expanded={expanded}
          onNodeToggle={(event, nodeIds) => setExpanded(nodeIds)}
        >
          {renderTree([item], expanded, setExpanded)}
        </MemoizedTreeView>
      </div>
    );
  };

  return (
    <div>
      <button onClick={expandAllNodes}>
        <HeightIcon />
      </button>
      <button onClick={collapseAllNodes}>Collapse All</button>

      <List
        className={classes.list}
        height={600}
        itemCount={treeData.length}
        itemSize={(index) => itemSizes[index]}
        width="100%"
      >
        {rowRenderer}
      </List>
    </div>
  );
};

export default TreeComponent;
